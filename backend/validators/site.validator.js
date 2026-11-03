import { z } from 'zod';
import { INDIAN_STATES } from '../constants/states.js';

const name = z.string().trim().min(1, 'Enter a site name').max(120);
// Optional — an empty string clears it.
const code = z.string().trim().toUpperCase().max(30);
const address = z.string().trim().max(300);
const discom = z.string().trim().max(120);
const organisation = z.string().trim().max(120);
const state = z.union([z.literal(''), z.enum(INDIAN_STATES, { error: 'Pick a state from the list' })]);
const consumerCategory = z.string().trim().max(60);

export const createSiteSchema = z.object({
  name,
  code: code.default(''),
  address: address.default(''),
  discom: discom.default(''),
  organisation: organisation.default(''),
  state: state.default(''),
  consumerCategory: consumerCategory.default(''),
});

/** Partial update — send only what changed. */
export const updateSiteSchema = z
  .object({ name, code, address, discom, organisation, state, consumerCategory })
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Nothing to update');

export const siteIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid site id'),
});
