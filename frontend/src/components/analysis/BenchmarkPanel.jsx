import DataTable from './DataTable.jsx';
import Panel, { CsvButton } from './Panel.jsx';
import { SiteLink } from './cells.jsx';
import { formatInr, formatNumber, formatPf, siteLabel } from '../../utils/format.js';

const name = (row) => siteLabel(row.site) || 'Unassigned bills';

const COLUMNS = [
  {
    key: 'site',
    label: 'Site',
    render: (r) => <SiteLink site={r.site}>{name(r)}</SiteLink>,
    sort: (r) => name(r),
    csv: name,
  },
  { key: 'discom', label: 'DISCOM', render: (r) => r.site?.discom || '—', sort: (r) => r.site?.discom, csv: (r) => r.site?.discom },
  { key: 'kwh', label: 'kWh', align: 'right', render: (r) => formatNumber(r.kwh), sort: (r) => r.kwh, csv: (r) => r.kwh },
  {
    key: 'avgMonthlyKwh',
    label: 'kWh / month',
    align: 'right',
    render: (r) => formatNumber(r.avgMonthlyKwh),
    sort: (r) => r.avgMonthlyKwh,
    csv: (r) => r.avgMonthlyKwh,
  },
  {
    key: 'averagePf',
    label: 'Avg PF',
    align: 'right',
    render: (r) => formatPf(r.averagePf),
    sort: (r) => r.averagePf,
    csv: (r) => r.averagePf,
  },
  {
    key: 'lowestPf',
    label: 'Lowest PF',
    align: 'right',
    render: (r) => formatPf(r.lowestPf?.value),
    sort: (r) => r.lowestPf?.value,
    csv: (r) => r.lowestPf?.value,
  },
  {
    key: 'peakMd',
    label: 'Peak MD kVA',
    align: 'right',
    render: (r) => formatNumber(r.peakMd?.value, 1),
    sort: (r) => r.peakMd?.value,
    csv: (r) => r.peakMd?.value,
  },
  {
    key: 'use',
    label: 'Peak ÷ CD',
    align: 'right',
    render: (r) => (r.maxUtilisationPct == null ? '—' : `${formatNumber(r.maxUtilisationPct, 1)}%`),
    sort: (r) => r.maxUtilisationPct,
    csv: (r) => r.maxUtilisationPct,
  },
  {
    key: 'pfPenalty',
    label: 'PF penalty',
    align: 'right',
    render: (r) => formatInr(r.pfPenalty),
    sort: (r) => r.pfPenalty,
    csv: (r) => r.pfPenalty,
  },
  {
    key: 'potentialSavings',
    label: 'Savings / year',
    align: 'right',
    render: (r) => formatInr(r.potentialSavings),
    sort: (r) => r.potentialSavings,
    csv: (r) => r.potentialSavings,
  },
  { key: 'alerts', label: 'Alerts', align: 'right', render: (r) => r.alerts, sort: (r) => r.alerts, csv: (r) => r.alerts },
  { key: 'bills', label: 'Bills', align: 'right', render: (r) => r.bills, sort: (r) => r.bills, csv: (r) => r.bills },
];

/** The site that comes out on top for `pick`, or null when no site has a value. */
const leader = (rows, pick, lowest = false) =>
  rows.reduce((best, row) => {
    const value = pick(row);
    if (value == null || !(value > 0 || lowest)) return best;
    return !best || (lowest ? value < pick(best) : value > pick(best)) ? row : best;
  }, null);

/** Sites side by side; any column sorts. The cards up top name the leader in each. */
export default function BenchmarkPanel({ benchmark }) {
  const leaders = [
    { label: 'Highest consumption', row: leader(benchmark, (r) => r.kwh), show: (r) => `${formatNumber(r.kwh)} kWh` },
    { label: 'Poorest power factor', row: leader(benchmark, (r) => r.averagePf ?? r.lowestPf?.value, true), show: (r) => formatPf(r.averagePf ?? r.lowestPf?.value) },
    { label: 'Highest demand', row: leader(benchmark, (r) => r.peakMd?.value), show: (r) => `${formatNumber(r.peakMd.value, 1)} kVA` },
    { label: 'Largest savings potential', row: leader(benchmark, (r) => r.potentialSavings), show: (r) => `${formatInr(r.potentialSavings)} / yr` },
  ];

  return (
    <Panel
      title="Multi-site benchmarking"
      actions={<CsvButton fileName="site-benchmark.csv" columns={COLUMNS} rows={benchmark} />}
    >
      <div className="grid grid-cols-2 gap-px border-b border-line bg-line lg:grid-cols-4">
        {leaders.map(({ label, row, show }) => (
          <div key={label} className="min-w-0 bg-surface px-5 py-4">
            <p className="label-caps truncate">{label}</p>
            <p className="mt-1 truncate font-semibold text-ink">{row ? name(row) : '—'}</p>
            <p className="num mt-0.5 truncate text-xs text-subtle">{row ? show(row) : 'No data'}</p>
          </div>
        ))}
      </div>
      <DataTable
        columns={COLUMNS}
        rows={benchmark}
        rowKey={(r) => r.site?.id ?? 'none'}
        initialSort={{ key: 'kwh', dir: 'desc' }}
      />
    </Panel>
  );
}
