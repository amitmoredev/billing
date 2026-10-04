import { TriangleAlert } from 'lucide-react';

// Columns top out below the frame, leaving room for the callout and tooltips.
const HEADROOM = 0.8;
const GRIDLINES = [0.25, 0.5, 0.75, 1];

/**
 * Single-series column chart in plain HTML: one baseline, columns capped at
 * 24px with a 4px rounded top, hairline gridlines, and a tooltip per column.
 * Columns grow in left to right on mount; re-key the chart to replay it.
 * Earlier periods sit back in grey and the latest takes the accent. `flagged`
 * marks one column in the warning tone with a labelled callout, so the state
 * never rides on colour alone.
 *
 * data: [{ label, tooltip?, value }]
 */
export default function ColumnChart({
  data,
  flagged,
  flagLabel,
  formatValue = String,
  labelEvery = 1,
  className = 'h-40',
}) {
  const top = Math.max(...data.map((d) => d.value)) / HEADROOM;
  const last = data.length - 1;

  const toneFor = (index) => {
    if (index === flagged) return 'bg-warn-fg';
    if (index === last) return 'bg-accent';
    return 'bg-brand-300 group-hover:bg-brand-400';
  };

  return (
    <div>
      <div className={`relative ${className}`}>
        {GRIDLINES.map((line) => (
          <span
            key={line}
            aria-hidden
            className="absolute inset-x-0 h-px bg-line"
            style={{ bottom: `${line * 100}%` }}
          />
        ))}
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-line-strong" />

        <div className="relative flex h-full items-end gap-0.5">
          {data.map((d, index) => (
            <div key={index} className="group flex h-full flex-1 items-end justify-center">
              <div
                className={`grow-up relative w-full max-w-6 rounded-t-sm transition-colors ${toneFor(index)}`}
                style={{
                  height: `${Math.max((d.value / top) * 100, 1)}%`,
                  animationDelay: `${index * Math.min(40, 480 / data.length)}ms`,
                }}
              >
                {index === flagged && flagLabel && (
                  <span
                    className="absolute bottom-full right-0 mb-1.5 flex items-center gap-1 whitespace-nowrap rounded-md
                      bg-warn-soft px-1.5 py-0.5 text-[10px] font-semibold text-warn-fg ring-1 ring-inset
                      ring-warn-line transition-opacity group-hover:opacity-0"
                  >
                    <TriangleAlert className="size-3" />
                    {flagLabel}
                  </span>
                )}

                <span
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2
                    whitespace-nowrap rounded-md bg-elevated px-2 py-1 text-[11px] font-semibold text-ink
                    opacity-0 shadow-float ring-1 ring-line transition-opacity group-hover:opacity-100"
                >
                  {d.tooltip ?? d.label} · {formatValue(d.value)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Axis labels, counted back from the latest so the current period always shows. */}
      <div aria-hidden className="mt-2 flex gap-0.5">
        {data.map((d, index) => (
          <span key={index} className="flex-1 text-center text-[10px] font-medium text-subtle">
            {(last - index) % labelEvery === 0 ? d.label : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
