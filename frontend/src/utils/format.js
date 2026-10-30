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

export const isPdf = (mimeType) => mimeType === 'application/pdf';

/** "9876543210" -> "+91 98765 43210" */
export const formatPhone = (phone) =>
  phone ? `+91 ${phone.slice(0, 5)} ${phone.slice(5)}` : '—';

/** "Pune Plant 2 · PLT-02" — the one way a site is named in a list or dropdown. */
export const siteLabel = (site) => (site ? [site.name, site.code].filter(Boolean).join(' · ') : '');

/** A person's name, or their number when no name was given. */
export const displayName = (user) => user?.name || formatPhone(user?.phone);
