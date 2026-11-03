// Month keys are "YYYY-MM" strings, the same as bills carry. Indian financial
// years run April to March; FY 2025-26 is April 2025 to March 2026.

/** "2026-03" shifted by `n` months (negative goes back). */
export const addMonths = (month, n) => {
  const [year, mon] = month.split('-').map(Number);
  const index = year * 12 + (mon - 1) + n;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
};

export const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

/** The year a month's financial year starts in: "2026-02" -> 2025. */
export const fyStartYear = (month) => {
  const [year, mon] = month.split('-').map(Number);
  return mon >= 4 ? year : year - 1;
};

/** 2025 -> "FY 2025-26" */
export const fyLabel = (startYear) => `FY ${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;

/** Every financial year from the one holding `firstMonth` to the current one, newest first. */
export const fyOptions = (firstMonth) => {
  const latest = fyStartYear(currentMonth());
  const earliest = firstMonth ? Math.min(fyStartYear(firstMonth), latest) : latest;
  const years = [];
  for (let year = latest; year >= earliest; year -= 1) years.push(year);
  return years;
};

/**
 * The period picker's state as the API's `{ from, to }`. Either may be
 * undefined: no bounds at all means every bill so far.
 */
export const toRange = ({ period, fy, month, from, to }) => {
  const now = currentMonth();
  switch (period) {
    case 'last12':
    case 'last24':
    case 'last36':
      return { from: addMonths(now, 1 - Number(period.slice(4))), to: now };
    case 'fy':
      return { from: `${fy}-04`, to: `${Number(fy) + 1}-03` };
    case 'month':
      return month ? { from: month, to: month } : {};
    case 'custom':
      return { from: from || undefined, to: to || undefined };
    default:
      return {};
  }
};
