import mongoose from 'mongoose';
import { Site } from '../models/site.model.js';
import { BILL_STATUS, Bill } from '../models/bill.model.js';

// Data layer: Mongo queries only. No business rules, no HTTP concepts.

// What a site shows of its creator: a name to label it, the role to say "admin".
// Never the phone or email — every account sees every site.
const CREATOR_FIELDS = 'name role';

export const create = (payload) => Site.create(payload);

export const findById = (id) => Site.findById(id);

export const exists = (id) => Site.exists({ _id: id });

/** Fills in `site.createdBy` with the creator's name and role. */
export const populateCreator = (site) => site.populate('createdBy', CREATOR_FIELDS);

/** All sites, A–Z. Sites number in the dozens, so the list is never paged. */
export const findAll = () =>
  Site.find().collation({ locale: 'en' }).sort({ name: 1 }).populate('createdBy', CREATOR_FIELDS);

/**
 * One row per (site, status) with its bill count; `site` is null for bills
 * with no site. Half-finished uploads are left out, as everywhere they're shown.
 * Pass `site` (an id) to count a single site.
 */
export const countBillsBySiteAndStatus = ({ site } = {}) =>
  Bill.aggregate([
    {
      $match: {
        status: { $ne: BILL_STATUS.PENDING_UPLOAD },
        // aggregate() never casts, so the id is made an ObjectId here.
        ...(site && { site: new mongoose.Types.ObjectId(site) }),
      },
    },
    { $group: { _id: { site: '$site', status: '$status' }, count: { $sum: 1 } } },
    { $project: { _id: 0, site: '$_id.site', status: '$_id.status', count: 1 } },
  ]);

/**
 * One row per site with how many different customer numbers its bills carry —
 * one per electricity connection. Bills whose number isn't filled in yet don't
 * count. Pass `site` (an id) to count a single site.
 */
export const countConsumersBySite = ({ site } = {}) =>
  Bill.aggregate([
    {
      $match: {
        'parameters.customerNumber': { $nin: [null, ''] },
        ...(site && { site: new mongoose.Types.ObjectId(site) }),
      },
    },
    { $group: { _id: '$site', numbers: { $addToSet: '$parameters.customerNumber' } } },
    { $project: { _id: 0, site: '$_id', consumers: { $size: '$numbers' } } },
  ]);

/** Every bill pointing at the site, finished upload or not — what blocks a delete. */
export const countBills = (id) => Bill.countDocuments({ site: id });
