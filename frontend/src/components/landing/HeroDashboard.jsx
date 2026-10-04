import { useState } from 'react';
import { ArrowUpRight, Gauge, OctagonAlert } from 'lucide-react';
import ColumnChart from '../charts/ColumnChart.jsx';
import { CONSUMPTION_TREND, FINANCIALS } from '../../constants/showcase.constants.js';

const RANGES = [12, 24, 36];

const KPIS = [
  { label: 'Energy cost', value: FINANCIALS.annualCost, note: 'This year', tone: 'text-subtle' },
  { label: 'Avoidable cost', value: FINANCIALS.avoidableCost, note: 'Penalties', tone: 'text-warn-fg' },
  { label: 'Potential savings', value: FINANCIALS.potentialSavings, note: 'Per year', tone: 'text-ok-fg' },
];

/** A small working preview of the product: the range toggle re-draws the trend. */
export default function HeroDashboard() {
  const [range, setRange] = useState(12);
  const data = CONSUMPTION_TREND.slice(-range);

  return (
    <figure aria-label="Preview of the EIP dashboard" className="card overflow-hidden rounded-2xl shadow-raised">
      <div className="flex items-center gap-2 border-b border-line bg-sunken px-4 py-3">
        <span className="size-2.5 rounded-full bg-line-strong" />
        <span className="size-2.5 rounded-full bg-line-strong" />
        <span className="size-2.5 rounded-full bg-line-strong" />
      </div>

      <div className="space-y-4 p-4 sm:p-6">
        <dl className="grid grid-cols-3 gap-3">
          {KPIS.map((kpi) => (
            <div key={kpi.label} className="min-w-0 rounded-xl border border-line bg-sunken p-3 sm:p-4">
              <dt className="truncate text-xs font-semibold text-subtle">{kpi.label}</dt>
              <dd className="mt-1 truncate text-lg font-semibold tracking-tight text-ink proportional-nums sm:text-2xl">
                {kpi.value}
              </dd>
              <p className={`mt-0.5 truncate text-xs font-medium ${kpi.tone}`}>{kpi.note}</p>
            </div>
          ))}
        </dl>

        <div className="rounded-xl border border-line p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">Monthly consumption</p>
              <p className="text-xs text-subtle">MWh</p>
            </div>

            <div role="group" aria-label="Trend range" className="flex shrink-0 rounded-lg border border-line bg-sunken p-0.5">
              {RANGES.map((months) => (
                <button
                  key={months}
                  type="button"
                  onClick={() => setRange(months)}
                  aria-pressed={range === months}
                  className={`focus-ring rounded-md px-2.5 py-0.5 text-xs font-semibold transition ${
                    range === months ? 'bg-accent text-on-accent' : 'text-muted hover:text-ink'
                  }`}
                >
                  {months}M
                </button>
              ))}
            </div>
          </div>

          {/* Keyed by range so the columns grow in again on every switch. */}
          <ColumnChart
            key={range}
            data={data}
            flagged={data.length - 1}
            flagLabel="+18%"
            formatValue={(value) => `${value} MWh`}
            labelEvery={range / 6}
            className="h-36"
          />
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-line p-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sunken text-ink ring-1 ring-inset ring-line">
            <Gauge className="size-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">Power factor below target</p>
            <p className="truncate text-xs text-subtle">Plant 02 · 0.86 vs 0.99</p>
          </div>
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-danger-soft px-2 py-0.5 text-[11px]
              font-semibold text-danger-fg ring-1 ring-inset ring-danger-line"
          >
            <OctagonAlert className="size-3" />
            Critical
          </span>
          <ArrowUpRight className="hidden size-4 shrink-0 text-subtle sm:block" />
        </div>
      </div>
    </figure>
  );
}
