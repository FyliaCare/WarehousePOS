// Delete Account Edge Function
// Handles GDPR-compliant account and data deletion

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { handleCors, errorResponse, successResponse } from '../_shared/cors.ts';
import { getEnv, createSupabaseClient } from '../_shared/utils.ts';

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Only allow POST requests
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405, undefined, req);
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Missing or invalid authorization header', 401, undefined, req);
    }

    const accessToken = authHeader.replace('Bearer ', '');

    // Create a client with the user's token to get their info
    const supabaseUrl = getEnv('SUPABASE_URL');
    const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');
    
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } }
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return errorResponse('Unauthorized - invalid token', 401, undefined, req);
    }

    console.log(`Processing account deletion for user: ${user.id}`);

    // Parse request body (for future use with additional options)
    try {
      await req.json();
    } catch {
      // Body is optional
    }

    // Create admin client for deletion operations
    const adminClient = createSupabaseClient();

    // Get user's business information first
    const { data: userData, error: userDataError } = await adminClient
      .from('users')
      .select('business_id, role')
      .eq('id', user.id)
      .single();

    if (userDataError) {
      console.error('Error fetching user data:', userDataError);
    }

    const businessId = userData?.business_id;
    const userRole = userData?.role;

    // Check if user is the only owner of a business
    if (businessId && userRole === 'owner') {
      const { data: otherOwners, error: ownersError } = await adminClient
        .from('users')
        .select('id')
        .eq('business_id', businessId)
        .eq('role', 'owner')
        .neq('id', user.id);

      if (ownersError) {
        console.error('Error checking other owners:', ownersError);
      }

      // If no other owners, we need to handle business deletion or transfer
      if (!otherOwners || otherOwners.length === 0) {
        // Check if there are other users in the business
        const { data: otherUsers } = await adminClient
          .from('users')
          .select('id')
          .eq('business_id', businessId)
          .neq('id', user.id);

        if (otherUsers && otherUsers.length > 0) {
          return errorResponse(
            'You are the only owner of this business. Please transfer ownership to another user before deleting your account.',
            400,
            { code: 'SOLE_OWNER_WITH_USERS' },
            req
          );
        }

        // No other users, delete the entire business and associated data
        console.log(`Deleting business ${businessId} and all associated data`);
        
        // Delete in order of dependencies (child tables first)
        const tablesToDelete = [
          'payment_transactions',
          'delivery_assignments',
          'deliveries',
          'order_items',
          'orders',
          'inventory_transactions',
          'stock_alerts',
          'products',
          'categories',
          'customers',
          'suppliers',
          'delivery_zones',
          'riders',
          'receipts',
          'audit_logs',
          'users', // Delete other users first
        ];

        for (const table of tablesToDelete) {
          const { error: deleteError } = await adminClient
            .from(table)
            .delete()
            .eq('business_id', businessId);
          
          if (deleteError) {
            console.warn(`Warning deleting from ${table}:`, deleteError.message);
          } else {
            console.log(`Deleted data from ${table}`);
          }
        }

        // Delete the business itself
        const { error: businessDeleteError } = await adminClient
          .from('businesses')
          .delete()
          .eq('id', businessId);

        if (businessDeleteError) {
          console.error('Error deleting business:', businessDeleteError);
        } else {
          console.log(`Deleted business ${businessId}`);
        }
      }
    } else if (businessId) {
      // User is not an owner, just remove their user record
      console.log(`Removing user ${user.id} from business ${businessId}`);
      
      const { error: userDeleteError } = await adminClient
        .from('users')
        .delete()
        .eq('id', user.id);

      if (userDeleteError) {
        console.error('Error deleting user record:', userDeleteError);
      }
    }

    // Delete from phone_users if exists
    const { error: phoneUserError } = await adminClient
      .from('phone_users')
      .delete()
      .eq('id', user.id);

    if (phoneUserError) {
      console.warn('Warning deleting phone_users:', phoneUserError.message);
    }

    // Delete pending OTPs
    if (user.phone) {
      const { error: otpError } = await adminClient
        .from('otp_codes')
        .delete()
        .eq('phone', user.phone);

      if (otpError) {
        console.warn('Warning deleting OTPs:', otpError.message);
      }
    }

    // Finally, delete the auth user using admin API
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(user.id);

    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError);
      return errorResponse(
        'Failed to delete account. Please contact support.',
        500,
        { code: 'AUTH_DELETE_FAILED' },
        req
      );
    }

    console.log(`Successfully deleted account for user: ${user.id}`);

    return successResponse({
      message: 'Account successfully deleted',
      deletedAt: new Date().toISOString(),
    }, req);

  } catch (error) {
    console.error('Delete account error:', error);
    return errorResponse(
      'An unexpected error occurred',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' },
      req
    );
  }
});
