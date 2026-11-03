// Month keys are "YYYY-MM" strings: they sort and compare correctly as text.

/** "2026-03" shifted by `n` months (negative goes back). */
export const addMonths = (month, n) => {
  const [year, mon] = month.split('-').map(Number);
  const index = year * 12 + (mon - 1) + n;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
};

/** Every month from `from` to `to`, both included. */
export const monthsBetween = (from, to) => {
  const months = [];
  for (let month = from; month <= to; month = addMonths(month, 1)) months.push(month);
  return months;
};

/**
 * Capacitor bank (kVAR) needed to lift a load of `kw` from power factor `pf`
 * to `target`: kW × (tan φ1 − tan φ2). Zero when the PF already meets target.
 */
export const capacitorKvar = (kw, pf, target) => {
  if (!kw || !pf || pf >= target) return 0;
  return kw * (Math.tan(Math.acos(pf)) - Math.tan(Math.acos(target)));
};

/** The middle value (mean of the middle two for an even count); null for none. */
export const median = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/** Percentage change from `previous` to `current`; null when there is nothing to compare against. */
export const percentChange = (current, previous) =>
  previous ? ((current - previous) / previous) * 100 : null;
