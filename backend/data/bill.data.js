import mongoose from 'mongoose';
import { Bill } from '../models/bill.model.js';
import { escapeRegex } from '../utils/regex.js';

// Data layer: Mongo queries only. No business rules, no HTTP concepts.

// What a bill carries of its site: enough to label it, nothing more.
const SITE_FIELDS = 'name code discom';

// `site: null` matches bills with no site, so callers pass null for "unassigned".
const siteMatch = (site) => (site === undefined ? {} : { site });

export const create = (payload) => Bill.create(payload);

export const findById = (id) => Bill.findById(id);

/** Fills in `bill.site` with the site's name and code. */
export const populateSite = (bill) => bill.populate('site', SITE_FIELDS);

export const findMany = async ({ status, site, search, page, limit }) => {
  const filter = { ...siteMatch(site) };
  if (status) filter.status = status;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [
      { 'file.originalName': rx },
      { 'parameters.consumerName': rx },
      { 'parameters.customerNumber': rx },
    ];
  }

  const [items, total] = await Promise.all([
    Bill.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('site', SITE_FIELDS)
      .lean(),
    Bill.countDocuments(filter),
  ]);

  return { items, total };
};

export const updateById = (id, update) =>
  Bill.findByIdAndUpdate(id, update, { returnDocument: 'after', runValidators: true });

export const deleteById = (id) => Bill.findByIdAndDelete(id);

/** Points every listed bill at `site` (null = no site) in one write. */
export const assignSite = async (ids, site) => {
  const result = await Bill.updateMany({ _id: { $in: ids } }, { $set: { site } });
  return { matched: result.matchedCount, modified: result.modifiedCount };
};

// Unlike find(), aggregate() never casts, so a string id would match nothing.
export const countByStatus = ({ site } = {}) =>
  Bill.aggregate([
    { $match: siteMatch(site ? new mongoose.Types.ObjectId(site) : site) },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
