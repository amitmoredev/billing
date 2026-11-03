import { useMemo } from 'react';
import DataTable from './DataTable.jsx';
import Panel, { CsvButton, Pill } from './Panel.jsx';
import { BillLink, ConnectionCell, SiteLink } from './cells.jsx';
import { ALERT_TYPES, READING_ISSUES, SEVERITY_LABELS, SEVERITY_STYLES } from '../../constants/analytics.constants.js';
import { connectionLabel, formatChange, formatInr, formatMonth, formatNumber, formatPf, siteLabel } from '../../utils/format.js';

/** One line on what tripped the alert. */
const detail = (alert) => {
  switch (alert.type) {
    case 'PF_LOW':
      return `PF ${formatPf(alert.value)} against a ${alert.threshold} target`;
    case 'PF_PENALTY':
      return `${formatInr(alert.value)} charged for low PF`;
    case 'CD_EXCEEDED':
      return `MD ${formatNumber(alert.value, 1)} kVA over CD of ${formatNumber(alert.threshold)} kVA`;
    case 'HIGH_MD':
      return `MD ${formatNumber(alert.value, 1)} kVA is ${formatNumber((alert.value / alert.threshold) * 100)}% of CD`;
    case 'CONSUMPTION_SPIKE':
      return `${formatNumber(alert.value)} kWh, ${formatChange(alert.changePct)} on ${formatNumber(alert.previous)} kWh the month before`;
    case 'MISSING_BILL': {
      // Gaps needn't be in a row, so the months are named rather than given as a range.
      const named = alert.months.slice(0, 3).map(formatMonth).join(', ');
      const more = alert.months.length - 3;
      return alert.months.length === 1
        ? `No bill for ${named}`
        : `${alert.months.length} months with no bill: ${named}${more > 0 ? ` and ${more} more` : ''}`;
    }
    case 'DATA_CHECK':
      return alert.issues.map((issue) => READING_ISSUES[issue] ?? issue).join('; ');
    default:
      return '';
  }
};

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

const COLUMNS = [
  {
    key: 'severity',
    label: 'Priority',
    render: (a) => <Pill style={SEVERITY_STYLES[a.severity]}>{SEVERITY_LABELS[a.severity]}</Pill>,
    sort: (a) => -SEVERITY_ORDER[a.severity],
    csv: (a) => a.severity,
  },
  {
    key: 'type',
    label: 'Alert',
    render: (a) => <span className="font-medium">{ALERT_TYPES[a.type]?.label ?? a.type}</span>,
    sort: (a) => a.type,
    csv: (a) => ALERT_TYPES[a.type]?.label ?? a.type,
  },
  { key: 'detail', label: 'Detail', render: (a) => <span className="text-muted">{detail(a)}</span>, csv: detail },
  {
    key: 'connection',
    label: 'Connection',
    render: (a) => <ConnectionCell connection={a.connection} />,
    sort: (a) => siteLabel(a.connection.site),
    csv: (a) => connectionLabel(a.connection),
  },
  {
    key: 'month',
    label: 'Month',
    render: (a) =>
      a.bill ? (
        <BillLink bill={a.bill}>{formatMonth(a.month)}</BillLink>
      ) : (
        <SiteLink site={a.connection.site}>{formatMonth(a.month)}</SiteLink>
      ),
    sort: (a) => a.month,
    csv: (a) => a.month,
  },
];

/**
 * Every condition the period's bills trip, newest first. The chips filter by
 * type (`type` / `onTypeChange`, so the Overview can open it pre-filtered).
 * Each alert opens its bill — or, for a missing bill, its site.
 */
export default function AlertsPanel({ alerts, type, onTypeChange: setType }) {
  const rows = useMemo(
    () => (type ? alerts.items.filter((alert) => alert.type === type) : alerts.items),
    [alerts.items, type]
  );

  const chip = (value, label, count) => (
    <button
      key={value || 'all'}
      type="button"
      onClick={() => setType(value)}
      aria-pressed={type === value}
      className={`focus-ring inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1
        ring-inset transition ${
          type === value
            ? 'bg-accent text-on-accent ring-accent'
            : 'bg-surface text-muted ring-line hover:bg-hover hover:text-ink'
        }`}
    >
      {label}
      <span className="num opacity-75">{count}</span>
    </button>
  );

  return (
    <Panel
      title="Alerts"
      actions={<CsvButton fileName="alerts.csv" columns={COLUMNS} rows={rows} />}
    >
      <div className="flex flex-wrap gap-2 border-b border-line px-5 py-3">
        {chip('', 'All', alerts.items.length)}
        {Object.entries(ALERT_TYPES).map(([key, { label }]) => chip(key, label, alerts.counts[key] ?? 0))}
      </div>
      <DataTable
        key={type}
        columns={COLUMNS}
        rows={rows}
        rowKey={(a) => `${a.type}:${a.connection.key}:${a.month}`}
        pageSize={15}
        empty="No alerts for this period."
      />
    </Panel>
  );
}
