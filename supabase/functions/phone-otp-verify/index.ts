// Edge Function: Verify OTP and create Supabase Auth session
// v9 - Simplified and fixed user lookup
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseClient, formatPhone, hashOTP, isDevelopment } from '../_shared/utils.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const isDev = isDevelopment();
  console.log('phone-otp-verify v9 - isDev:', isDev);

  try {
    const { phone, country, otp, purpose = 'login' } = await req.json();
    
    if (!phone || !country || !otp) {
      return errorResponse('Phone, country, and OTP are required', 400, undefined, req);
    }
    
    if (!/^\d{6}$/.test(otp)) {
      return errorResponse('Invalid OTP format', 400, undefined, req);
    }

    const formattedPhone = formatPhone(phone, country);
    const supabase = createSupabaseClient();
    console.log('Verifying OTP for:', formattedPhone);

    // STEP 1: Verify OTP (skip in dev mode)
    if (!isDev) {
      const otpHash = await hashOTP(otp);
      const { data: otpRecord, error: otpError } = await supabase
        .from('phone_otps')
        .select('*')
        .eq('phone', formattedPhone)
        .eq('otp_hash', otpHash)
        .eq('purpose', purpose)
        .is('verified_at', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (otpError) {
        console.error('OTP query error:', otpError);
        return errorResponse('Database error', 500, undefined, req);
      }

      if (!otpRecord) {
        return errorResponse('Invalid or expired code', 400, undefined, req);
      }

      // Mark OTP as verified
      await supabase.from('phone_otps')
        .update({ verified_at: new Date().toISOString() })
        .eq('id', otpRecord.id);
      
      console.log('OTP verified, record ID:', otpRecord.id);
    } else {
      console.log('[DEV] Skipping OTP verification');
    }

    // STEP 2: Create or find user
    let userId: string | null = null;
    let isNewUser = false;

    // First, try to find existing user by phone
    console.log('Looking for existing user with phone:', formattedPhone);
    const { data: userList } = await supabase.auth.admin.listUsers({ 
      page: 1,
      perPage: 1000 
    });
    
    const phoneVariants = [
      formattedPhone,
      formattedPhone.replace('+', ''),
      formattedPhone.replace('+233', '0'),
      formattedPhone.replace('+234', '0'),
    ];
    
    const existingUser = userList?.users?.find(u => 
      phoneVariants.includes(u.phone || '') || phoneVariants.includes(u.phone?.replace('+', '') || '')
    );

    if (existingUser) {
      userId = existingUser.id;
      console.log('Found existing user:', userId);
    } else {
      // Create new user
      console.log('Creating new user with phone:', formattedPhone);
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        phone: formattedPhone,
        phone_confirm: true,
        user_metadata: { country, created_via: 'phone_otp' },
      });

      if (newUser?.user) {
        userId = newUser.user.id;
        isNewUser = true;
        console.log('New user created:', userId);
      } else {
        console.error('Failed to create user:', createError);
        return errorResponse(createError?.message || 'Failed to create account', 500, undefined, req);
      }
    }

    if (!userId) {
      return errorResponse('Failed to identify user', 500, undefined, req);
    }

    // STEP 3: Generate session via email/password
    const fakeEmail = `${userId}@phone.warehousepos.app`;
    const tempPassword = crypto.randomUUID();

    console.log('Setting up session for user:', userId, 'with email:', fakeEmail);

    // Update user with email and password
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      email: fakeEmail,
      password: tempPassword,
      email_confirm: true,
    });

    if (updateError) {
      console.error('Update user error:', updateError);
      // If email conflict, the user might already have this email - try to sign in anyway
      if (!updateError.message?.includes('email')) {
        return errorResponse('Failed to configure account: ' + updateError.message, 500, undefined, req);
      }
    }

    // STEP 4: Sign in to get session
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password: tempPassword,
    });

    if (signInError || !signInData?.session) {
      console.error('Sign in error:', signInError);
      return errorResponse('Failed to create session: ' + (signInError?.message || 'Unknown error'), 500, undefined, req);
    }
    console.log('Session created for user:', userId);

    // STEP 5: Get user profile from public.users table
    const { data: profile } = await supabase
      .from('users')
      .select('*, tenant:tenants(*), store:stores(*)')
      .eq('id', userId)
      .maybeSingle();

    console.log('Profile lookup result:', profile ? 'Found' : 'Not found');

    return successResponse({
      user: signInData.user,
      session: signInData.session,
      profile: profile || null,
      isNewUser,
      needsProfileSetup: !profile,
    }, req);

  } catch (error) {
    console.error('Verify OTP error:', error);
    return errorResponse('An unexpected error occurred: ' + String(error), 500, undefined, req);
  }
});
