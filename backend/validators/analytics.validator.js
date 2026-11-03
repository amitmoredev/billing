import { z } from 'zod';
import { OBJECT_ID, blankToUndefined, optionalMonth, optionalNumber } from './bill.validator.js';

/**
 * Dashboard filters plus the assumptions the viewer may override. Any
 * assumption left out falls back to the service's default.
 */
export const overviewQuerySchema = z
  .object({
    site: z.preprocess(blankToUndefined, z.string().regex(OBJECT_ID, 'Invalid site id').optional()),
    discom: z.preprocess(blankToUndefined, z.string().max(120).optional()),
    organisation: z.preprocess(blankToUndefined, z.string().max(120).optional()),
    state: z.preprocess(blankToUndefined, z.string().max(60).optional()),
    consumerCategory: z.preprocess(blankToUndefined, z.string().max(60).optional()),
    from: optionalMonth,
    to: optionalMonth,

    pfTarget: optionalNumber({ min: 0.5, max: 1 }),
    highMdPct: optionalNumber({ min: 50, max: 100 }),
    spikePct: optionalNumber({ min: 1, max: 500 }),
    cdMarginPct: optionalNumber({ min: 0, max: 50 }),
    capacitorCost: optionalNumber({ min: 0 }), // ₹ per kVAR
    demandRate: optionalNumber({ min: 0 }), // ₹ per kVA per month
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, { path: ['to'], message: 'End month is before start month' });
