import { z } from 'zod';
import { SIGN_IN_SCOPES } from '../policies/permissions.js';
import { normalizePhone10 } from '../utils/phone.js';

// Accepts whatever the user typed and hands the controller a clean 10-digit number.
export const phoneSchema = z
  .string()
  .transform((value) => normalizePhone10(value))
  .refine(Boolean, 'Enter a valid 10-digit mobile number');

const otp = z
  .string()
  .transform((value) => value.replace(/\D/g, ''))
  .refine((value) => value.length === 6, 'Enter the 6-digit code');

// Which sign-in screen the request comes from; omitted for the dashboard.
const scope = z.enum(Object.keys(SIGN_IN_SCOPES)).optional();

export const sendOtpSchema = z.object({ phone: phoneSchema, scope });

export const verifyOtpSchema = z.object({ phone: phoneSchema, otp, scope });
