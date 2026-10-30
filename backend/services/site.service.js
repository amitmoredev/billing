import * as siteData from '../data/site.data.js';
import { ROLES } from '../models/user.model.js';
import { BILL_STATUS } from '../models/bill.model.js';
import { ACTIONS, SUBJECTS, can } from '../policies/permissions.js';
import { ApiError } from '../utils/api-error.js';

// Service layer for sites. Every account sees every site and may add one;
// changing or removing one is for its creator (or an admin) — see permissions.js.

const NAME_TAKEN = 'A site with this name already exists.';

// The unique index on name is the real guard; a lookup first would still race.
// Reported as a field error so the form can show it under the name input.
const rethrowDuplicate = (error) => {
  if (error?.code === 11000) {
    throw ApiError.conflict(NAME_TAKEN, [{ field: 'name', message: NAME_TAKEN }]);
  }
  throw error;
};

/** `{ id, name, isAdmin }` from a populated creator; null if unknown or since deleted. */
const toCreatorDto = (creator) =>
  creator?.role === undefined
    ? null
    : { id: String(creator._id), name: creator.name, isAdmin: creator.role === ROLES.ADMIN };

const EMPTY_COUNTS = { total: 0, pending: 0, verified: 0 };

/** Rows of (site, status, count) folded into `{ siteId | 'none': { total, pending, verified } }`. */
const tallyBills = (rows) => {
  const bySite = {};
  for (const { site, status, count } of rows) {
    const key = site ? String(site) : 'none';
    const counts = (bySite[key] ??= { ...EMPTY_COUNTS });
    counts.total += count;
    if (status === BILL_STATUS.UPLOADED) counts.pending += count;
    if (status === BILL_STATUS.SUBMITTED) counts.verified += count;
  }
  return bySite;
};

const countsFor = async (id) =>
  tallyBills(await siteData.countBillsBySiteAndStatus({ site: id }))[id] ?? { ...EMPTY_COUNTS };

const toDto = (site, bills = EMPTY_COUNTS) => ({
  ...site.toJSON(),
  createdBy: toCreatorDto(site.createdBy),
  bills,
});

const loadOrThrow = async (id) => {
  const site = await siteData.findById(id);
  if (!site) throw ApiError.notFound('Site not found');
  return site;
};

/** Route guards only know "may edit some site"; this checks this site. */
const assertMayChange = (user, action, site) => {
  if (!can(user, action, SUBJECTS.SITE, site)) {
    throw ApiError.forbidden(
      `You can only ${action === ACTIONS.DELETE ? 'delete' : 'edit'} sites you added.`
    );
  }
};

/** Throws a field error unless `id` names a real site. For callers that assign bills. */
export const assertExists = async (id, field = 'site') => {
  if (!(await siteData.exists(id))) {
    throw ApiError.badRequest('Validation failed', [{ field, message: 'This site no longer exists' }]);
  }
};

/** Every site with its bill counts, plus the counts for bills not under any site. */
export const listSites = async () => {
  const [sites, rows] = await Promise.all([siteData.findAll(), siteData.countBillsBySiteAndStatus()]);
  const counts = tallyBills(rows);
  return {
    items: sites.map((site) => toDto(site, counts[site.id])),
    unassigned: counts.none ?? { ...EMPTY_COUNTS },
  };
};

export const createSite = async (values, user) => {
  const site = await siteData.create({ ...values, createdBy: user._id }).catch(rethrowDuplicate);
  await siteData.populateCreator(site);
  return toDto(site);
};

export const updateSite = async (id, changes, user) => {
  const site = await loadOrThrow(id);
  assertMayChange(user, ACTIONS.UPDATE, site);

  site.set(changes);
  await site.save().catch(rethrowDuplicate);
  const [bills] = await Promise.all([countsFor(id), siteData.populateCreator(site)]);
  return toDto(site, bills);
};

/** Refused while bills still point here — deleting would silently unassign them. */
export const deleteSite = async (id, user) => {
  const site = await loadOrThrow(id);
  assertMayChange(user, ACTIONS.DELETE, site);

  const bills = await siteData.countBills(id);
  if (bills) {
    throw ApiError.conflict(
      `${bills} ${bills === 1 ? 'bill is' : 'bills are'} still assigned to this site. Move or delete ${
        bills === 1 ? 'it' : 'them'
      } first.`
    );
  }
  await site.deleteOne();
  return { id };
};
