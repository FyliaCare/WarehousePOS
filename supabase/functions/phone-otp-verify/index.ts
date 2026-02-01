// @ts-nocheck
// Edge Function: Verify OTP and create Supabase Auth session
// v12 - SIMPLIFIED: Better error handling, cleaner flow
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, successResponse, errorResponse } from '../_shared/cors.ts';
import { createSupabaseClient, formatPhone, hashOTP, isDevelopment } from '../_shared/utils.ts';

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const isDev = isDevelopment();
  const startTime = Date.now();
  console.log('phone-otp-verify v12 - isDev:', isDev);

  let supabase: ReturnType<typeof createSupabaseClient>;
  
  try {
    supabase = createSupabaseClient();
  } catch (e) {
    console.error('Failed to create Supabase client:', e);
    return errorResponse('Service unavailable', 503, undefined, req);
  }

  try {
    const body = await req.json();
    const { phone, country, otp, purpose = 'login' } = body;
    console.log('Request:', { phone, country, purpose, hasOtp: !!otp });
    
    if (!phone || !country || !otp) {
      return errorResponse('Phone, country, and OTP are required', 400, undefined, req);
    }

    const allowedPurposes = ['login', 'registration'];
    if (!allowedPurposes.includes(purpose)) {
      return errorResponse('Invalid purpose', 400, undefined, req);
    }
    
    if (!/^\d{6}$/.test(otp)) {
      return errorResponse('Invalid OTP format - must be 6 digits', 400, undefined, req);
    }

    const formattedPhone = formatPhone(phone, country);
    console.log('Formatted phone:', formattedPhone);

    // STEP 1: Verify OTP
    if (!isDev) {
      const otpHash = await hashOTP(otp);
      
      // Check if valid OTP exists
      const { data: otpRecord, error: otpError } = await supabase
        .from('phone_otps')
        .select('id, expires_at, verified_at')
        .eq('phone', formattedPhone)
        .eq('otp_hash', otpHash)
        .eq('purpose', purpose)
        .maybeSingle();

      if (otpError) {
        console.error('OTP query error:', otpError);
        return errorResponse('Database error', 500, undefined, req);
      }

      if (!otpRecord) {
        console.log('No matching OTP found');
        return errorResponse('Invalid verification code', 400, undefined, req);
      }

      // Check if already verified
      if (otpRecord.verified_at) {
        console.log('OTP already used');
        return errorResponse('This code has already been used. Please request a new one.', 400, undefined, req);
      }

      // Check if expired
      if (new Date(otpRecord.expires_at) < new Date()) {
        console.log('OTP expired');
        return errorResponse('Code has expired. Please request a new one.', 400, undefined, req);
      }

      // Mark OTP as verified
      await supabase
        .from('phone_otps')
        .update({ verified_at: new Date().toISOString() })
        .eq('id', otpRecord.id);
      
      console.log('OTP verified in', Date.now() - startTime, 'ms');
    } else {
      console.log('[DEV] Skipping OTP verification');
    }

    // STEP 2: Get or create auth user
    let userId: string;
    let isNewUser = false;

    // Check phone_users mapping first
    const { data: phoneMapping } = await supabase
      .from('phone_users')
      .select('user_id')
      .eq('phone', formattedPhone)
      .maybeSingle();

    if (phoneMapping?.user_id) {
      userId = phoneMapping.user_id;
      console.log('Found existing user:', userId);
    } else {
      // Try to create new user
      console.log('Creating new user for phone:', formattedPhone);
      
      try {
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          phone: formattedPhone,
          phone_confirm: true,
          user_metadata: { country, created_via: 'phone_otp' },
        });

        console.log('Create user result:', { 
          userId: newUser?.user?.id, 
          errorMessage: createError?.message,
          errorStatus: createError?.status,
          errorName: createError?.name
        });

        if (newUser?.user) {
          userId = newUser.user.id;
          isNewUser = true;
          console.log('Created new user:', userId);
          
          // Save phone mapping
          const { error: mappingError } = await supabase.from('phone_users')
            .upsert({ phone: formattedPhone, user_id: userId }, { onConflict: 'phone' });
          if (mappingError) console.error('Mapping error:', mappingError);
        } else if (createError?.message?.includes('already') || createError?.message?.includes('exists')) {
          // User exists - find them
          console.log('User already exists, searching...');
          const { data: userList, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
          
          if (listError) {
            console.error('List users error:', listError);
          }
          
          console.log('Total users found:', userList?.users?.length);
          
          const existingUser = userList?.users?.find((u: any) => 
            u.phone === formattedPhone || 
            u.phone === formattedPhone.replace('+', '')
          );
          
          if (!existingUser) {
            console.error('Could not find existing user with phone:', formattedPhone);
            // Try to create anyway with email fallback
            const phoneDigits = formattedPhone.replace(/\D/g, '');
            const fallbackEmail = `${phoneDigits}@phone.warehousepos.app`;
            
            console.log('Trying fallback creation with email:', fallbackEmail);
            const { data: fallbackUser, error: fallbackError } = await supabase.auth.admin.createUser({
              email: fallbackEmail,
              email_confirm: true,
              phone: formattedPhone,
              phone_confirm: true,
              user_metadata: { country, created_via: 'phone_otp', phone: formattedPhone },
            });
            
            if (fallbackUser?.user) {
              userId = fallbackUser.user.id;
              isNewUser = true;
              console.log('Created user with fallback:', userId);
              
              await supabase.from('phone_users')
                .upsert({ phone: formattedPhone, user_id: userId }, { onConflict: 'phone' });
            } else {
              console.error('Fallback creation failed:', fallbackError);
              return errorResponse('Account error - please try again', 500, undefined, req);
            }
          } else {
            userId = existingUser.id;
            console.log('Found existing user:', userId);
            
            // Save phone mapping for next time
            await supabase.from('phone_users')
              .upsert({ phone: formattedPhone, user_id: userId }, { onConflict: 'phone' });
          }
        } else {
          // Other error - try with email as primary
          console.error('Create user failed:', createError);
          
          const phoneDigits = formattedPhone.replace(/\D/g, '');
          const fallbackEmail = `${phoneDigits}@phone.warehousepos.app`;
          
          console.log('Primary creation failed, trying with email:', fallbackEmail);
          const { data: fallbackUser, error: fallbackError } = await supabase.auth.admin.createUser({
            email: fallbackEmail,
            email_confirm: true,
            user_metadata: { country, created_via: 'phone_otp', phone: formattedPhone },
          });
          
          if (fallbackUser?.user) {
            userId = fallbackUser.user.id;
            isNewUser = true;
            console.log('Created user with email fallback:', userId);
            
            await supabase.from('phone_users')
              .upsert({ phone: formattedPhone, user_id: userId }, { onConflict: 'phone' });
          } else {
            console.error('All creation attempts failed:', fallbackError);
            return errorResponse('Failed to create account: ' + (fallbackError?.message || createError?.message || 'Unknown error'), 500, undefined, req);
          }
        }
      } catch (createException) {
        console.error('Exception during user creation:', createException);
        return errorResponse('Failed to create account: ' + (createException instanceof Error ? createException.message : String(createException)), 500, undefined, req);
      }
    }

    // STEP 3: Create session via email/password
    const phoneDigits = formattedPhone.replace(/\D/g, '');
    const email = `${phoneDigits}@phone.warehousepos.app`;
    const password = crypto.randomUUID();

    console.log('Setting up credentials for:', userId);

    // Update user credentials
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      email,
      password,
      email_confirm: true,
    });

    if (updateError) {
      console.error('Update user error:', updateError);
      return errorResponse('Failed to setup session', 500, undefined, req);
    }

    // Sign in
    console.log('Signing in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signInData?.session) {
      console.error('Sign in error:', signInError);
      return errorResponse('Failed to create session', 500, undefined, req);
    }

    console.log('Session created in', Date.now() - startTime, 'ms');

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*, tenant:tenants(*), store:stores(*)')
      .eq('id', userId)
      .maybeSingle();

    return successResponse({
      user: signInData.user,
      session: signInData.session,
      profile: profile || null,
      isNewUser,
      needsProfileSetup: !profile,
    }, req);

  } catch (error) {
    console.error('Verify OTP error:', error);
    return errorResponse('Verification failed: ' + (error instanceof Error ? error.message : String(error)), 500, undefined, req);
  }
});
