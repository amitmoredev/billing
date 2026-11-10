import { DISCOM_SUGGESTIONS } from '../constants/site.constants.js';

// Rules over the parameter form's definitions. The API applies the same ones
// (backend/utils/bill-fields.js); these only decide what the form shows.

/** DISCOM names are typed by hand on sites, so they match whole, ignoring case and spacing. */
export const normalizeDiscom = (discom) => String(discom ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

/** No DISCOMs = every bill; otherwise only bills whose site's DISCOM is listed. */
export const appliesToDiscom = (field, discom) => {
  if (!field.discoms?.length) return true;
  const wanted = normalizeDiscom(discom);
  return Boolean(wanted) && field.discoms.some((d) => normalizeDiscom(d) === wanted);
};

/** The fields a bill from `discom` takes, in form order. */
export const fieldsForDiscom = (fields, discom) =>
  fields.filter((field) => !field.archived && appliesToDiscom(field, discom));

/** `fields` laid out under their sections, in order. Sections with nothing to show are left out. */
export const toSections = (groups, fields) =>
  groups
    .map((group) => ({ ...group, fields: fields.filter((field) => field.group === group.key) }))
    .filter((group) => group.fields.length);

/** The field's own hint, else its range when it has both ends ("0 to 1"). */
export const fieldHint = (field) =>
  field.hint || (field.min != null && field.max != null ? `${field.min} to ${field.max}` : undefined);

/** "All DISCOMs", or the list. */
export const discomScope = (field) => (field.discoms?.length ? field.discoms.join(', ') : 'All DISCOMs');

/**
 * DISCOMs to offer when scoping a field: those on sites first (the ones that
 * matter), then the usual suggestions, then anything already picked.
 */
export const discomOptions = (sites, picked = []) => {
  const seen = new Map();
  for (const name of [...sites.map((site) => site.discom), ...picked, ...DISCOM_SUGGESTIONS]) {
    const key = normalizeDiscom(name);
    if (key && !seen.has(key)) seen.set(key, name.trim());
  }
  return [...seen.values()];
};
