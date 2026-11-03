export const formatBytes = (bytes) => {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

/** "2026-06" -> "Jun 2026" */
export const formatMonth = (value) => {
  if (!value) return '—';
  const [year, month] = value.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

/** 1234567.8 -> "12,34,568" (Indian grouping). `digits` = decimals kept. */
export const formatNumber = (value, digits = 0) =>
  value == null || !Number.isFinite(value)
    ? '—'
    : value.toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** 123456 -> "₹1,23,456" */
export const formatInr = (value) => (value == null ? '—' : `₹${formatNumber(value)}`);

/** 12.345 -> "+12.3%"; the sign shows which way it moved. */
export const formatChange = (value) =>
  value == null ? '—' : `${value > 0 ? '+' : ''}${formatNumber(value, 1)}%`;

/** 0.9 -> "0.900" */
export const formatPf = (value) => (value == null ? '—' : value.toFixed(3));

export const isPdf =(mimeType) => mimeType === 'application/pdf';

/** "9876543210" -> "+91 98765 43210" */
export const formatPhone = (phone) =>
  phone ? `+91 ${phone.slice(0, 5)} ${phone.slice(5)}` : '—';

/** "Pune Plant 2 · PLT-02" — the one way a site is named in a list or dropdown. */
export const siteLabel = (site) => (site ? [site.name, site.code].filter(Boolean).join(' · ') : '');

/** "Pune Plant 2 · PLT-02 / 1234567" — one electricity connection (site + consumer number) as text. */
export const connectionLabel = ({ site, customerNumber }) =>
  `${siteLabel(site) || 'Unassigned'} / ${customerNumber || '—'}`;

const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 });

/** 125000 -> "1.3L" — for axis ticks, where full figures crowd. */
export const formatCompact = (value) => (value == null ? '—' : compact.format(value));

/** A person's name, or their number when no name was given. */
export const displayName = (user) => user?.name || formatPhone(user?.phone);
