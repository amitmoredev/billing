// What the Analysis page offers. The figures themselves are worked out by the
// API (backend/services/analytics.service.js); this file only names them.

export const PERIOD_MODES = [
  { value: 'all', label: 'All bills so far' },
  { value: 'last12', label: 'Last 12 months' },
  { value: 'last24', label: 'Last 24 months' },
  { value: 'last36', label: 'Last 36 months' },
  { value: 'fy', label: 'Financial year' },
  { value: 'month', label: 'Billing month' },
  { value: 'custom', label: 'Custom range' },
];

/**
 * The thresholds and rates behind alerts and savings. Defaults match the API's;
 * a blank rate means "not known", and the figures that need it stay empty.
 */
export const ASSUMPTION_FIELDS = [
  { name: 'pfTarget', label: 'Target power factor', step: '0.01', min: 0.5, max: 1, defaultValue: 0.95 },
  { name: 'highMdPct', label: 'High MD from', unit: '% of CD', min: 50, max: 100, defaultValue: 90 },
  { name: 'spikePct', label: 'Sudden jump in kWh', unit: '% MoM', min: 1, max: 500, defaultValue: 20 },
  { name: 'cdMarginPct', label: 'Headroom over peak MD', unit: '%', min: 0, max: 50, defaultValue: 10 },
  { name: 'capacitorCost', label: 'Capacitor cost', unit: '₹/kVAr', min: 0, hint: 'For payback' },
  { name: 'demandRate', label: 'Demand charge', unit: '₹/kVA/mo', min: 0, hint: 'To price a lower CD' },
];

export const DEFAULT_ASSUMPTIONS = Object.fromEntries(
  ASSUMPTION_FIELDS.map((field) => [field.name, field.defaultValue ?? ''])
);

export const ALERT_TYPES = {
  PF_LOW: { label: 'PF below target' },
  PF_PENALTY: { label: 'PF penalty' },
  CD_EXCEEDED: { label: 'Contract demand exceeded' },
  HIGH_MD: { label: 'High MD' },
  CONSUMPTION_SPIKE: { label: 'Sudden consumption increase' },
  MISSING_BILL: { label: 'Missing bill' },
  DATA_CHECK: { label: 'Reading to check' },
};

/** Why a bill's readings were queried (the API's READING_ISSUES). */
export const READING_ISSUES = {
  LOW_KWH: 'kWh far below this connection’s usual month',
  KWH_OVER_KVAH: 'kWh is higher than kVAh',
  KW_OVER_KVA: 'kW MD is higher than kVA MD',
  PF_MISMATCH: 'PF does not match kWh ÷ kVAh',
};

export const SEVERITY_LABELS = { high: 'High', medium: 'Medium', low: 'Check' };

export const SEVERITY_STYLES = {
  high: 'bg-danger-soft text-danger-fg ring-danger-line',
  medium: 'bg-warn-soft text-warn-fg ring-warn-line',
  low: 'bg-neutral-soft text-neutral-fg ring-neutral-line',
};

/** What the contract demand review suggests for a connection. */
export const CD_ACTIONS = {
  increase: { label: 'Increase CD', style: 'bg-danger-soft text-danger-fg ring-danger-line' },
  reduce: { label: 'Reduce CD', style: 'bg-ok-soft text-ok-fg ring-ok-line' },
  'more-data': { label: 'Need 6+ months', style: 'bg-neutral-soft text-neutral-fg ring-neutral-line' },
  ok: { label: 'Right-sized', style: 'bg-accent-soft text-accent-fg ring-accent-line' },
};

