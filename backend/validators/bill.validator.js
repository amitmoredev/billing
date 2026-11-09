import { z } from 'zod';
import { BILL_STATUS } from '../models/bill.model.js';

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
export const OBJECT_ID = /^[a-f\d]{24}$/i;

/** List filter value meaning "bills with no site yet". */
export const NO_SITE = 'none';

// Form inputs arrive as strings; empty means "not filled", not zero.
export const blankToUndefined = (v) => {
  const value = typeof v === 'string' ? v.trim() : v;
  return value === '' || value === null ? undefined : value;
};

export const optionalNumber = ({ min = -Infinity, max = Infinity } = {}) =>
  z.preprocess((v) => {
    const value = blankToUndefined(v);
    return value === undefined ? undefined : Number(value);
  }, z.number().finite().min(min).max(max).optional());

const optionalText = z.preprocess(blankToUndefined, z.string().min(1).max(200).optional());

export const optionalMonth = z.preprocess(
  blankToUndefined,
  z.string().regex(MONTH_PATTERN, 'Expected format YYYY-MM').optional()
);

/** Draft save — every field optional. */
export const parametersDraftSchema = z.object({
  customerNumber: optionalText,
  consumerName: optionalText,
  sanctionedLoad: optionalNumber({ min: 0 }),
  contractDemand: optionalNumber({ min: 0 }),
  connectedLoad: optionalNumber({ min: 0 }),
  billMonth: optionalMonth,
  kwhConsumption: optionalNumber({ min: 0 }),
  kvahConsumption: optionalNumber({ min: 0 }),
  kvaMd: optionalNumber({ min: 0 }),
  kwMd: optionalNumber({ min: 0 }),
  powerFactor: optionalNumber({ min: 0, max: 1 }),
  powerFactorPenalty: optionalNumber(), // may be negative (rebate)
  currentBillMonth: optionalMonth,
});

// Omitted = leave as is; blank or null = clear the site.
const siteRef = z.preprocess(
  (v) => (blankToUndefined(v) === undefined && v !== undefined ? null : v),
  z.string().regex(OBJECT_ID, 'Pick a site').nullable().optional()
);

/** Draft save body: the parameters plus the bill's site. */
export const billDraftSchema = parametersDraftSchema.extend({ site: siteRef });

// A bill without these cannot be reconciled against anything.
const REQUIRED_ON_SUBMIT = ['site', 'customerNumber', 'consumerName', 'billMonth', 'kwhConsumption'];

/** Final submit — same shape, but the site and identifying fields must be present. */
export const billSubmitSchema = billDraftSchema.superRefine((data, ctx) => {
  for (const field of REQUIRED_ON_SUBMIT) {
    if (data[field] === undefined || data[field] === null) {
      ctx.addIssue({ code: 'custom', path: [field], message: 'Required' });
    }
  }
});

export const presignSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  size: z.coerce.number().int().positive(),
  siteId: z.preprocess(blankToUndefined, z.string().regex(OBJECT_ID, 'Pick a site').optional()),
});

// A site id, or NO_SITE for unassigned bills.
const siteFilter = z.preprocess(
  blankToUndefined,
  z.union([z.literal(NO_SITE), z.string().regex(OBJECT_ID, 'Invalid site id')]).optional()
);

export const listQuerySchema = z.object({
  status: z.enum([BILL_STATUS.PENDING_UPLOAD, BILL_STATUS.UPLOADED, BILL_STATUS.SUBMITTED]).optional(),
  site: siteFilter,
  search: z.preprocess(blankToUndefined, z.string().max(200).optional()),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const statsQuerySchema = z.object({ site: siteFilter });

export const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid bill id'),
});

/** Excel export: a site (or NO_SITE) and a month range, either end open. */
export const exportQuerySchema = z
  .object({ site: siteFilter, from: optionalMonth, to: optionalMonth })
  .refine((q) => !q.from || !q.to || q.from <= q.to, { path: ['to'], message: 'End month is before start month' });

export const monthsQuerySchema = z.object({ site: siteFilter });
