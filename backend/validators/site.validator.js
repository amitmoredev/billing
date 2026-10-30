import { z } from 'zod';

const name = z.string().trim().min(1, 'Enter a site name').max(120);
// Optional — an empty string clears it.
const code = z.string().trim().toUpperCase().max(30);
const address = z.string().trim().max(300);
const discom = z.string().trim().max(120);

export const createSiteSchema = z.object({
  name,
  code: code.default(''),
  address: address.default(''),
  discom: discom.default(''),
});

/** Partial update — send only what changed. */
export const updateSiteSchema = z
  .object({ name, code, address, discom })
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Nothing to update');

export const siteIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid site id'),
});
