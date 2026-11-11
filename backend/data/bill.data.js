import mongoose from 'mongoose';
import { BILL_STATUS, Bill } from '../models/bill.model.js';
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

export const findMany = async ({ status, site, search, customerNumber, billMonth, page, limit }) => {
  const filter = { ...siteMatch(site) };
  if (status) filter.status = status;
  if (customerNumber) filter['parameters.customerNumber'] = customerNumber;
  if (billMonth) filter['parameters.billMonth'] = billMonth;
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

// Unlike find(), aggregate() never casts, so a string id would match nothing.
export const countByStatus = ({ site } = {}) =>
  Bill.aggregate([
    { $match: siteMatch(site ? new mongoose.Types.ObjectId(site) : site) },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

/**
 * The consumer numbers and bill months filled in on listed bills (finished
 * uploads only), optionally at one site — the choices of the list's filters.
 */
export const distinctFilterValues = async ({ site } = {}) => {
  const match = { status: { $ne: BILL_STATUS.PENDING_UPLOAD }, ...siteMatch(site) };
  const [customerNumbers, months] = await Promise.all([
    Bill.distinct('parameters.customerNumber', match),
    Bill.distinct('parameters.billMonth', match),
  ]);
  return { customerNumbers: customerNumbers.filter(Boolean), months: months.filter(Boolean) };
};

// What an export needs of a bill's site: its label and DISCOM.
const EXPORT_SITE_FIELDS = 'name code discom';

/**
 * Verified bills with a bill month in `from`..`to` (YYYY-MM, either open),
 * optionally at one site — the rows of an Excel export.
 */
export const findVerifiedForExport = ({ from, to, site } = {}) => {
  const month = { $nin: [null, ''] };
  if (from) month.$gte = from;
  if (to) month.$lte = to;
  return Bill.find({ status: BILL_STATUS.SUBMITTED, 'parameters.billMonth': month, ...siteMatch(site) })
    .select('site file.originalName parameters submittedAt updatedAt')
    .populate('site', EXPORT_SITE_FIELDS)
    .lean();
};

/** Every bill month that has a verified bill, oldest first; `site` narrows it to one site. */
export const distinctVerifiedMonths = async ({ site } = {}) => {
  const months = await Bill.distinct('parameters.billMonth', {
    status: BILL_STATUS.SUBMITTED,
    ...siteMatch(site),
  });
  return months.filter(Boolean).sort();
};
