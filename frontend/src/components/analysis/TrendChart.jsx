import { formatChange, formatCompact, formatMonth, formatNumber } from '../../utils/format.js';

/** A round step near `raw`: 1, 2, 2.5 or 5 times a power of ten. */
const niceStep = (raw) => {
  const power = 10 ** Math.floor(Math.log10(raw));
  const fraction = raw / power;
  return (fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10) * power;
};

/** "2026-01" -> "Jan 26", short enough for a 36-month axis. */
const axisLabel = (month) => {
  const [year, mon] = month.split('-');
  return `${new Date(Number(year), Number(mon) - 1, 1).toLocaleDateString('en-IN', { month: 'short' })} ${year.slice(2)}`;
};

/**
 * Monthly kWh as columns on one baseline, with clean y-axis ticks. Earlier
 * months sit back in a light step, the latest takes the accent and carries
 * the only value label. Months with no verified bill get a hollow stub, so
 * a gap never reads as zero use. Hovering a column shows how many connections
 * were billed and its like-for-like change on the month before and a year before.
 *
 * months: [{ month, kwh, bills, expected, momPct, yoyPct }] — `kwh: null` = no bill.
 */
export default function TrendChart({ months }) {
  const max = Math.max(0, ...months.map((m) => m.kwh ?? 0));
  const step = niceStep(max / 4 || 1);
  const top = Math.ceil(max / step) * step || step;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const latest = months.findLastIndex((m) => m.kwh != null);
  const labelEvery = Math.max(1, Math.ceil(months.length / 12));
  const phoneLabelEvery = Math.max(1, Math.ceil(months.length / 4));
  const last = months.length - 1;

  return (
    <div className="flex gap-3">
      {/* Y axis: tick labels sit on their gridlines. */}
      <div aria-hidden className="relative h-60 w-10 shrink-0">
        {ticks.map((tick) => (
          <span
            key={tick}
            className="num absolute right-0 translate-y-1/2 text-[11px] text-subtle"
            style={{ bottom: `${(tick / top) * 100}%` }}
          >
            {formatCompact(tick)}
          </span>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        <div className="relative h-60">
          {ticks.map((tick) => (
            <span
              key={tick}
              aria-hidden
              className={`absolute inset-x-0 h-px ${tick === 0 ? 'bg-line-strong' : 'bg-line'}`}
              style={{ bottom: `${(tick / top) * 100}%` }}
            />
          ))}

          <div className="relative flex h-full items-end gap-0.5">
            {months.map((m, index) => {
              const isLatest = index === latest;
              const height = m.kwh == null ? 0 : Math.max((m.kwh / top) * 100, 0.5);
              // Tooltips near the edges open inward so they're never clipped.
              const align =
                index < months.length / 4 ? 'left-0' : index > (months.length * 3) / 4 ? 'right-0' : 'left-1/2 -translate-x-1/2';

              return (
                <div key={m.month} className="group relative flex h-full flex-1 items-end justify-center">
                  {m.kwh == null ? (
                    <span className="mb-0 h-1 w-full max-w-6 rounded-t-sm border border-b-0 border-dashed border-line-strong" />
                  ) : (
                    <div
                      className={`grow-up relative w-full max-w-6 rounded-t-sm transition-colors ${
                        isLatest ? 'bg-accent' : 'bg-brand-200 group-hover:bg-brand-400 dark:bg-brand-700 dark:group-hover:bg-brand-500'
                      }`}
                      style={{ height: `${height}%`, animationDelay: `${index * Math.min(30, 420 / months.length)}ms` }}
                    >
                      {isLatest && (
                        <span className="num absolute bottom-full right-1/2 mb-1 translate-x-1/2 whitespace-nowrap text-[11px] font-semibold text-ink transition-opacity group-hover:opacity-0">
                          {formatCompact(m.kwh)}
                        </span>
                      )}
                    </div>
                  )}

                  <div
                    role="tooltip"
                    className={`pointer-events-none absolute z-20 mb-2 w-max min-w-36 rounded-xl bg-elevated px-3 py-2
                      text-xs opacity-0 shadow-float ring-1 ring-line transition-opacity group-hover:opacity-100 ${align}`}
                    style={{ bottom: `${height}%` }}
                  >
                    <p className="font-semibold text-ink">{formatMonth(m.month)}</p>
                    {m.kwh == null ? (
                      <p className="mt-0.5 text-subtle">No verified bill</p>
                    ) : (
                      <dl className="mt-1 grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5">
                        <dt className="text-subtle">Consumption</dt>
                        <dd className="num text-right font-semibold text-ink">{formatNumber(m.kwh)} kWh</dd>
                        <dt className="text-subtle">Connections billed</dt>
                        <dd className={`num text-right ${m.bills < m.expected ? 'font-semibold text-warn-fg' : 'text-muted'}`}>
                          {m.bills} of {m.expected}
                        </dd>
                        <dt className="text-subtle">vs prev. month</dt>
                        <dd className="num text-right text-muted">{formatChange(m.momPct)}</dd>
                        <dt className="text-subtle">vs last year</dt>
                        <dd className="num text-right text-muted">{formatChange(m.yoyPct)}</dd>
                      </dl>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* X axis, counted back from the latest so the current month always shows. */}
        {[
          { every: labelEvery, className: 'hidden sm:flex' },
          { every: phoneLabelEvery, className: 'flex sm:hidden' },
        ].map(({ every, className }) => (
          <div key={className} aria-hidden className={`mt-2 gap-0.5 ${className}`}>
            {months.map((m, index) => (
              <span key={m.month} className="flex-1 whitespace-nowrap text-center text-[10px] font-medium text-subtle">
                {(last - index) % every === 0 ? axisLabel(m.month) : ''}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
