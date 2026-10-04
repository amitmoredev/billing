import { z } from 'zod';
import { BILL_STATUS } from '../models/bill.model.js';

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

// Form inputs arrive as strings; empty means "not filled", not zero.
const blankToUndefined = (v) => {
  const value = typeof v === 'string' ? v.trim() : v;
  return value === '' || value === null ? undefined : value;
};

const optionalNumber = ({ min = -Infinity, max = Infinity } = {}) =>
  z.preprocess((v) => {
    const value = blankToUndefined(v);
    return value === undefined ? undefined : Number(value);
  }, z.number().finite().min(min).max(max).optional());

const optionalText = z.preprocess(blankToUndefined, z.string().min(1).max(200).optional());

const optionalMonth = z.preprocess(
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

// A bill without these cannot be reconciled against anything.
const REQUIRED_ON_SUBMIT = ['customerNumber', 'consumerName', 'billMonth', 'kwhConsumption'];

/** Final submit — same shape, but the identifying fields must be present. */
export const parametersSubmitSchema = parametersDraftSchema.superRefine((data, ctx) => {
  for (const field of REQUIRED_ON_SUBMIT) {
    if (data[field] === undefined) {
      ctx.addIssue({ code: 'custom', path: [field], message: 'Required' });
    }
  }
});

export const presignSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  size: z.coerce.number().int().positive(),
});

export const listQuerySchema = z.object({
  status: z.enum([BILL_STATUS.PENDING_UPLOAD, BILL_STATUS.UPLOADED, BILL_STATUS.SUBMITTED]).optional(),
  search: z.preprocess(blankToUndefined, z.string().max(200).optional()),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid bill id'),
});
