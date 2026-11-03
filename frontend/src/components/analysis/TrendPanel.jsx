import { useState } from 'react';
import { ChartColumn, Table } from 'lucide-react';
import TrendChart from './TrendChart.jsx';
import DataTable from './DataTable.jsx';
import { CsvButton } from './Panel.jsx';
import { Change } from './cells.jsx';
import { formatMonth, formatNumber } from '../../utils/format.js';

const COLUMNS = [
  { key: 'month', label: 'Month', render: (r) => formatMonth(r.month), sort: (r) => r.month, csv: (r) => r.month },
  { key: 'kwh', label: 'kWh', align: 'right', render: (r) => formatNumber(r.kwh), sort: (r) => r.kwh, csv: (r) => r.kwh },
  {
    key: 'bills',
    label: 'Connections billed',
    align: 'right',
    render: (r) => <span className={r.bills < r.expected ? 'text-warn-fg' : ''}>{r.bills} of {r.expected}</span>,
    sort: (r) => r.bills,
    csv: (r) => r.bills,
  },
  {
    key: 'momPct',
    label: 'vs prev. month',
    align: 'right',
    render: (r) => <Change value={r.momPct} />,
    sort: (r) => r.momPct,
    csv: (r) => r.momPct,
  },
  {
    key: 'lastYearKwh',
    label: 'Same month last year',
    align: 'right',
    render: (r) => formatNumber(r.lastYearKwh),
    sort: (r) => r.lastYearKwh,
    csv: (r) => r.lastYearKwh,
  },
  {
    key: 'yoyPct',
    label: 'vs last year',
    align: 'right',
    render: (r) => <Change value={r.yoyPct} />,
    sort: (r) => r.yoyPct,
    csv: (r) => r.yoyPct,
  },
];

/** What a change is measured against. */
const basis = (month, connections) => (connections ? `vs ${formatMonth(month)}` : 'Nothing to compare');

/**
 * The page's lead: total kWh for the period as the hero figure, how the latest
 * month compares, and the month-by-month trend (as a chart or a table).
 * Changes are like for like — worked out only on connections billed in both
 * months — so a bill not uploaded yet never reads as a drop.
 */
export default function TrendPanel({ summary, trend, comparison }) {
  const [view, setView] = useState('chart');
  const latest = comparison?.latest;
  const period = comparison?.period;

  return (
    <section className="card flex h-full min-w-0 flex-col overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5 sm:px-6">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-muted">Total consumption</p>
          <p className="mt-1 font-sans text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            {formatNumber(summary.kwh)}
            <span className="ml-2 text-lg font-medium text-subtle">kWh</span>
          </p>
          <p className="mt-1.5 text-sm text-muted">
            {formatNumber(summary.avgMonthlyKwh)} kWh / month
            {period?.matchedBills ? (
              <>
                {' · '}
                <Change value={period.yoyPct} /> vs a year earlier
              </>
            ) : null}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div role="group" aria-label="View" className="flex rounded-lg bg-sunken p-0.5 ring-1 ring-inset ring-line">
            {[
              { value: 'chart', icon: ChartColumn, label: 'Chart' },
              { value: 'table', icon: Table, label: 'Table' },
            ].map(({ value, icon: IconComponent, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={view === value}
                onClick={() => setView(value)}
                className={`focus-ring inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition
                  ${view === value ? 'bg-surface text-ink shadow-card' : 'text-subtle hover:text-ink'}`}
              >
                <IconComponent className="size-3.5" />
                {label}
              </button>
            ))}
          </div>
          <CsvButton fileName="consumption-trend.csv" columns={COLUMNS} rows={trend} />
        </div>
      </div>

      {latest && (
        <dl className="mx-5 mt-5 grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0 rounded-xl bg-sunken/70 ring-1 ring-inset ring-line sm:mx-6">
          <Stat
            label={`Latest · ${formatMonth(latest.month)}`}
            value={`${formatNumber(latest.kwh)} kWh`}
            sub={latest.bills < latest.expected ? `${latest.bills} of ${latest.expected} connections billed` : null}
            warn={latest.bills < latest.expected}
          />
          <Stat
            label="Month on month"
            value={<Change value={latest.momPct} />}
            sub={basis(latest.previousMonth, latest.momConnections)}
          />
          <Stat
            label="Year on year"
            value={<Change value={latest.yoyPct} />}
            sub={basis(latest.lastYearMonth, latest.yoyConnections)}
          />
        </dl>
      )}

      {view === 'chart' ? (
        <div className="mt-auto px-5 pb-5 pt-8 sm:px-6">
          <TrendChart months={trend} />
        </div>
      ) : (
        <div className="mt-5 border-t border-line">
          <DataTable
            columns={COLUMNS}
            rows={trend}
            rowKey={(r) => r.month}
            initialSort={{ key: 'month', dir: 'desc' }}
            pageSize={12}
          />
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, sub, warn }) {
  return (
    <div className="min-w-0 px-3 py-3 sm:px-4">
      <dt className="label-caps truncate">{label}</dt>
      <dd className="mt-1 truncate text-base font-semibold text-ink sm:text-lg">{value}</dd>
      {sub && (
        <dd className={`mt-0.5 truncate text-xs ${warn ? 'font-medium text-warn-fg' : 'text-subtle'}`} title={sub}>
          {sub}
        </dd>
      )}
    </div>
  );
}
