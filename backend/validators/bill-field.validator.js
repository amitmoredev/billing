import { z } from 'zod';
import { FIELD_TYPES } from '../constants/bill-fields.js';
import { OBJECT_ID, blankToUndefined } from './bill.validator.js';

const label = z.string().trim().min(1, 'Enter a label').max(80);
const hint = z.string().trim().max(160);
const group = z.string().trim().min(1, 'Pick a section');
const unit = z.string().trim().max(20);
// Blank clears a limit.
const limit = z.preprocess((v) => {
  const value = blankToUndefined(v);
  return value === undefined ? null : Number(value);
}, z.number().finite().nullable());
const discoms = z.array(z.string().trim().min(1).max(120)).max(100);

const limitsInOrder = (data) => data.min == null || data.max == null || data.min <= data.max;
const LIMITS_ISSUE = { path: ['max'], message: 'Maximum is below the minimum' };

export const createFieldSchema = z
  .object({
    label,
    hint: hint.default(''),
    group,
    type: z.enum(Object.values(FIELD_TYPES), { error: 'Pick a type' }),
    unit: unit.default(''),
    min: limit.default(null),
    max: limit.default(null),
    required: z.boolean().default(false),
    discoms: discoms.default([]),
    inExport: z.boolean().default(true),
  })
  .refine(limitsInOrder, LIMITS_ISSUE);

/** Partial update — send only what changed. A field's key and type never change. */
export const updateFieldSchema = z
  .object({ label, hint, group, unit, min: limit, max: limit, required: z.boolean(), discoms, inExport: z.boolean(), archived: z.boolean() })
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Nothing to update')
  .refine(limitsInOrder, LIMITS_ISSUE);

const title = z.string().trim().min(1, 'Enter a section name').max(80);

export const createGroupSchema = z.object({ title });
export const updateGroupSchema = z.object({ title });

export const moveSchema = z.object({ direction: z.enum(['up', 'down']) });

export const idParamSchema = z.object({ id: z.string().regex(OBJECT_ID, 'Invalid id') });
