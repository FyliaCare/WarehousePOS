/**
 * Zod schemas for runtime validation of auth responses
 * Ensures type safety for Edge Function responses
 */
import { z } from 'zod';

// Session schema
export const SessionSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number().optional(),
  expires_at: z.number().optional(),
  token_type: z.string().optional(),
  user: z.object({
    id: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
  }).optional(),
});

export type ValidatedSession = z.infer<typeof SessionSchema>;

// User schema
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type ValidatedUser = z.infer<typeof UserSchema>;

// Profile schema
export const ProfileSchema = z.object({
  id: z.string(),
  auth_id: z.string().optional(),
  full_name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['owner', 'manager', 'cashier']),
  tenant_id: z.string().optional(),
  store_id: z.string().optional(),
  is_active: z.boolean().optional(),
});

export type ValidatedProfile = z.infer<typeof ProfileSchema>;

// OTP Send Response
export const OTPSendResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type ValidatedOTPSendResponse = z.infer<typeof OTPSendResponseSchema>;

// OTP Verify Response
export const OTPVerifyResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  user: UserSchema.optional(),
  session: SessionSchema.optional(),
  profile: ProfileSchema.optional(),
  needsProfileSetup: z.boolean().optional(),
});

export type ValidatedOTPVerifyResponse = z.infer<typeof OTPVerifyResponseSchema>;

// PIN Set Response
export const PINSetResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type ValidatedPINSetResponse = z.infer<typeof PINSetResponseSchema>;

// PIN Verify Response
export const PINVerifyResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  session: SessionSchema.optional(),
  user: UserSchema.optional(),
  profile: ProfileSchema.optional(),
  needsProfileSetup: z.boolean().optional(),
  lockedUntil: z.string().nullable().optional(),
  attemptsRemaining: z.number().optional(),
});

export type ValidatedPINVerifyResponse = z.infer<typeof PINVerifyResponseSchema>;

/**
 * Validates and parses OTP send response
 */
export function validateOTPSendResponse(data: unknown): ValidatedOTPSendResponse {
  try {
    return OTPSendResponseSchema.parse(data);
  } catch (error) {
    console.error('OTP Send response validation failed:', error);
    // Return safe fallback
    return {
      success: false,
      message: 'Invalid response format from server',
    };
  }
}

/**
 * Validates and parses OTP verify response
 */
export function validateOTPVerifyResponse(data: unknown): ValidatedOTPVerifyResponse {
  try {
    return OTPVerifyResponseSchema.parse(data);
  } catch (error) {
    console.error('OTP Verify response validation failed:', error);
    return {
      success: false,
      message: 'Invalid response format from server',
    };
  }
}

/**
 * Validates and parses PIN set response
 */
export function validatePINSetResponse(data: unknown): ValidatedPINSetResponse {
  try {
    return PINSetResponseSchema.parse(data);
  } catch (error) {
    console.error('PIN Set response validation failed:', error);
    return {
      success: false,
      message: 'Invalid response format from server',
    };
  }
}

/**
 * Validates and parses PIN verify response
 */
export function validatePINVerifyResponse(data: unknown): ValidatedPINVerifyResponse {
  try {
    return PINVerifyResponseSchema.parse(data);
  } catch (error) {
    console.error('PIN Verify response validation failed:', error);
    return {
      success: false,
      message: 'Invalid response format from server',
    };
  }
}
