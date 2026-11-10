import { BillField, BillFieldGroup } from '../models/bill-field.model.js';
import { Bill } from '../models/bill.model.js';

// Data layer: Mongo queries only. No business rules, no HTTP concepts.
// The form has dozens of fields at most, so lists are never paged.

const BY_POSITION = { order: 1, createdAt: 1 };

export const findAllFields = () => BillField.find().sort(BY_POSITION).lean();

export const findAllGroups = () => BillFieldGroup.find().sort(BY_POSITION).lean();

export const findFieldById = (id) => BillField.findById(id);

export const findGroupById = (id) => BillFieldGroup.findById(id);

export const findGroupByKey = (key) => BillFieldGroup.findOne({ key }).lean();

export const findFieldByKey = (key) => BillField.findOne({ key }).lean();

export const createField = (payload) => BillField.create(payload);

export const createGroup = (payload) => BillFieldGroup.create(payload);

export const countGroups = () => BillFieldGroup.countDocuments();

export const countFieldsInGroup = (group) => BillField.countDocuments({ group });

/** Fields and groups both sort by `order`; this is the highest one in use (−∞ when none). */
export const lastFieldOrder = async (group) =>
  (await BillField.findOne({ group }).sort({ order: -1 }).select('order').lean())?.order ?? -Infinity;

export const lastGroupOrder = async () =>
  (await BillFieldGroup.findOne().sort({ order: -1 }).select('order').lean())?.order ?? -Infinity;

/** The field or group just before / after `order`, for moving one up or down. */
export const findFieldNeighbour = ({ group, order, direction }) =>
  BillField.findOne({ group, order: direction === 'up' ? { $lt: order } : { $gt: order } }).sort({
    order: direction === 'up' ? -1 : 1,
  });

export const findGroupNeighbour = ({ order, direction }) =>
  BillFieldGroup.findOne({ order: direction === 'up' ? { $lt: order } : { $gt: order } }).sort({
    order: direction === 'up' ? -1 : 1,
  });

/** How many bills hold a value for `key` — what decides between delete and archive. */
export const countBillsWithValue = (key) =>
  Bill.countDocuments({ [`parameters.${key}`]: { $exists: true, $nin: [null, ''] } });

/** Inserts the group if missing; leaves an existing one (and an admin's renaming) alone. */
export const ensureGroup = ({ key, title, order }) =>
  BillFieldGroup.updateOne({ key }, { $setOnInsert: { key, title, order } }, { upsert: true });

/**
 * Inserts a built-in field, or brings an existing one in line with the code:
 * `locked` is always written, `initial` only when the field is new.
 */
export const upsertSystemField = ({ key, locked, initial }) =>
  BillField.updateOne({ key }, { $set: locked, $setOnInsert: { key, ...initial } }, { upsert: true });
