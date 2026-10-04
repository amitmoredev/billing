import { z } from 'zod';
import { phoneSchema } from './auth.validator.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const name = z.string().trim().min(1, 'Enter a name').max(120);

// Optional — an empty string clears it.
const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(200)
  .refine((value) => !value || EMAIL_PATTERN.test(value), 'Enter a valid email address');

export const createUserSchema = z.object({
  name,
  phone: phoneSchema,
  email: email.default(''),
});

/** Partial update — send only what changed. `isActive: false` blocks sign-in. */
export const updateUserSchema = z
  .object({ name, phone: phoneSchema, email, isActive: z.boolean() })
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Nothing to update');

export const listUsersQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const userIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid user id'),
});
