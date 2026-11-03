import { BILL_STATUS, Bill } from '../models/bill.model.js';
import { Site } from '../models/site.model.js';
import { escapeRegex } from '../utils/regex.js';

// Data layer: Mongo queries only. No business rules, no HTTP concepts.

const SITE_FIELDS = 'name code discom';

/**
 * Every verified bill that has a bill month, narrowed to one site and/or one
 * DISCOM. Dates are not filtered here: month-on-month, year-on-year and alerts
 * all need the months just outside the selected period.
 */
export const findVerifiedBills = async ({ site, discom } = {}) => {
  const filter = { status: BILL_STATUS.SUBMITTED, 'parameters.billMonth': { $nin: [null, ''] } };

  if (discom) {
    const ids = await Site.find({ discom: new RegExp(`^${escapeRegex(discom)}$`, 'i') }).distinct('_id');
    filter.site = { $in: site ? ids.filter((id) => String(id) === site) : ids };
  } else if (site) {
    filter.site = site;
  }

  return Bill.find(filter)
    .select('site parameters submittedAt updatedAt')
    .populate('site', SITE_FIELDS)
    .lean();
};
