import { RESERVED_KEYS } from '../constants/bill-fields.js';

// Pure helpers over parameter definitions, shared by validation, the bill
// service and the export. The frontend has the same rules in utils/bill-fields.js.

/** DISCOM names are typed by hand on sites, so they match whole, ignoring case and spacing. */
export const normalizeDiscom = (discom) => String(discom ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

/**
 * Whether a field belongs on a bill from `discom`. A field with no DISCOMs
 * applies everywhere; one with DISCOMs applies only to bills from those —
 * so a bill whose site has no DISCOM yet gets the everywhere fields only.
 */
export const appliesToDiscom = (field, discom) => {
  if (!field.discoms?.length) return true;
  const wanted = normalizeDiscom(discom);
  return Boolean(wanted) && field.discoms.some((d) => normalizeDiscom(d) === wanted);
};

/**
 * A storage key from a label: "Wheeling Charge @ 01.39" -> "wheelingCharge0139".
 * Unique against `taken` (suffix 2, 3, …) and never a reserved name. Labels
 * with no ASCII letters (Marathi, Hindi) fall back to "field", "field2", ….
 */
export const toFieldKey = (label, taken = []) => {
  const words = String(label ?? '')
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
  let base = words
    .map((word, i) => (i === 0 ? word.toLowerCase() : word[0].toUpperCase() + word.slice(1).toLowerCase()))
    .join('')
    .slice(0, 40);
  // "123 Units" -> "field123Units": a key must start with a letter.
  if (!/^[a-z]/.test(base)) base = `field${base.charAt(0).toUpperCase()}${base.slice(1)}`;

  const used = new Set([...taken, ...RESERVED_KEYS].map((key) => key.toLowerCase()));
  let key = base;
  for (let n = 2; used.has(key.toLowerCase()); n += 1) key = `${base}${n}`;
  return key;
};
