# Auth Regression Test Plan

Comprehensive scenarios to cover email/password, phone OTP, and PIN flows. Run against a staging environment with test credentials and isolated data. Replace placeholders with valid test accounts.

## Preconditions
- Environment variables configured for staging URLs and Supabase keys.
- Edge Functions deployed: phone-otp-send, phone-otp-verify, pin-set, pin-verify.
- Test phone numbers provisioned with SMS delivery or devOTP enabled in non-production.

## Test Matrix
- Channels: Email/Password, Phone OTP, PIN (existing user), PIN (lockout), Business setup post-auth.
- Roles: owner, manager, cashier (at least one per role where applicable).
- Countries: GH, NG.
- Devices: Desktop (Chrome), Mobile viewport (Chrome).

## Scenarios
1) Email sign-up and verification required
- Sign up with new email + strong password + full name.
- Assert Supabase returns needsEmailVerification when no session is issued.
- Complete verification link (if available) then sign in; expect needsBusinessSetup true and redirected to setup.

2) Email sign-in happy path
- Sign in existing email/password.
- Expect profile loaded with tenant/store; landing on POS dashboard; no needsProfileSetup flag.

3) Email wrong password and lockout behavior (if configured)
- Attempt 3 times with wrong password; assert user-friendly error and no session.

4) Phone OTP login existing user
- Request OTP for existing phone (GH and NG variants).
- In non-prod, use returned devOTP; else read SMS.
- Verify OTP; expect session + profile + needsProfileSetup false when tenant_id present.

5) Phone OTP registration (new phone)
- Request OTP for new phone; verify.
- Expect session issued but profile missing; needsProfileSetup true; ensure authStore reflects this.
- Complete business setup (tenant/store creation) and verify needsProfileSetup flips to false.

6) PIN set flow (authenticated user)
- After OTP login, call pin-set via UI.
- Validate client rejects invalid PINs (too short/long, sequential, repeated, common).
- On success, assert server accepts and authStore remains authenticated.

7) PIN verify happy path
- From signed-out state, open PIN login UI (if available) or call pin-verify through app flow.
- Enter correct PIN; expect session + profile restored; needsProfileSetup false.

8) PIN verify lockout
- Enter wrong PIN until attemptsRemaining hits 0; expect lockedUntil timestamp; further attempts blocked until window passes.
- After lockout window, correct PIN should succeed and reset counters.

9) RLS-protected data fetch
- With authenticated session, fetch tenants, stores, orders; ensure only tenant-linked data is returned.
- With a different user’s session, ensure access is denied or returns empty for unrelated tenant.

10) Sign out and session refresh
- Sign out; assert authStore clears user/tenant/store and needsProfileSetup resets.
- Trigger token refresh (if applicable); ensure state remains consistent.

## Data Cleanup
- Remove test tenants/stores/orders created during scenarios to keep staging clean.

## Reporting
- Capture screenshots for failed flows.
- Record timestamps and phone numbers used for OTP to trace SMS logs if needed.
