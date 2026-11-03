import { BILL_STATUS, Bill } from '../models/bill.model.js';
import { Site } from '../models/site.model.js';
import { escapeRegex } from '../utils/regex.js';

// Data layer: Mongo queries only. No business rules, no HTTP concepts.

const SITE_FIELDS = 'name code discom';

/** Site details the Analysis filters can narrow by. Matched whole, ignoring case. */
export const SITE_FILTERS = ['discom', 'organisation', 'state', 'consumerCategory'];

/**
 * Every verified bill that has a bill month, narrowed to one site and/or to
 * sites with the given details (DISCOM, organisation, state, consumer
 * category). Dates are not filtered here: month-on-month, year-on-year and
 * alerts all need the months just outside the selected period.
 */
export const findVerifiedBills = async ({ site, ...details } = {}) => {
  const filter = { status: BILL_STATUS.SUBMITTED, 'parameters.billMonth': { $nin: [null, ''] } };

  const siteMatch = {};
  for (const field of SITE_FILTERS) {
    if (details[field]) siteMatch[field] = new RegExp(`^${escapeRegex(details[field])}$`, 'i');
  }

  if (Object.keys(siteMatch).length) {
    const ids = await Site.find(siteMatch).distinct('_id');
    filter.site = { $in: site ? ids.filter((id) => String(id) === site) : ids };
  } else if (site) {
    filter.site = site;
  }

  return Bill.find(filter)
    .select('site parameters submittedAt updatedAt')
    .populate('site', SITE_FIELDS)
    .lean();
};
