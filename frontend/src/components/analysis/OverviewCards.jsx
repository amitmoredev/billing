import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  ChevronRight,
  FileQuestion,
  FileX2,
  Gauge,
  IndianRupee,
  PiggyBank,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { ALERT_TYPES } from '../../constants/analytics.constants.js';
import { formatInr, formatNumber } from '../../utils/format.js';

const ALERT_ICONS = {
  PF_LOW: Gauge,
  PF_PENALTY: IndianRupee,
  CD_EXCEEDED: Activity,
  HIGH_MD: TrendingUp,
  CONSUMPTION_SPIKE: Zap,
  MISSING_BILL: FileX2,
  DATA_CHECK: FileQuestion,
};

/** A small "see more" link at a card's foot that switches the page to another tab. */
function MoreLink({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-ring inline-flex items-center gap-1 rounded text-sm font-semibold text-accent-fg hover:underline"
    >
      {children}
      <ArrowRight className="size-3.5" />
    </button>
  );
}

/**
 * What fixing PF and contract demand would save a year, and what it costs —
 * the one filled card on the page, so the money stands out. A saving that
 * needs a rate not yet entered says so, rather than reading as ₹0.
 */
export function FinancialCard({ summary, savings, assumptions, connections, onOpen }) {
  const cuts = connections.filter((c) => c.demand?.action === 'reduce').length;
  const parts = [
    {
      label: 'Power factor',
      value: savings.powerFactor,
    },
    {
      label: 'Contract demand',
      value: savings.demand,
      hint:
        cuts && !assumptions.demandRate
          ? `Set ₹/kVA in Assumptions to price ${cuts} ${cuts === 1 ? 'cut' : 'cuts'}`
          : null,
    },
  ];

  return (
    <section
      className="relative overflow-hidden rounded-card bg-linear-to-br from-[#3a64c4] to-[#2f53a8] p-5 text-white
        shadow-[0_10px_28px_-12px_rgb(47_83_168/0.45)] ring-1 ring-inset ring-white/10 sm:p-6
        dark:from-[#2f5bc4] dark:to-[#284e9f] dark:text-on-accent"
    >
      <span aria-hidden className="pointer-events-none absolute -right-12 -top-14 size-44 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white/80">Estimated annual savings</p>
        <span className="grid size-9 place-items-center rounded-xl bg-white/15 ring-1 ring-inset ring-white/15">
          <PiggyBank className="size-5" />
        </span>
      </div>
      <p className="relative mt-1 text-4xl font-semibold tracking-tight">{formatInr(savings.total)}</p>

      <div className="relative mt-4 space-y-2.5">
        {parts.map((part) => (
          <div key={part.label}>
            <div className="flex justify-between text-xs">
              <span className="text-white/75">{part.label}</span>
              <span className="font-semibold">{formatInr(part.value)}</span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white/90"
                style={{ width: `${savings.total ? (part.value / savings.total) * 100 : 0}%` }}
              />
            </div>
            {part.hint && <p className="mt-1 text-[11px] text-white/70">{part.hint}</p>}
          </div>
        ))}
      </div>

      <dl className="relative mt-5 grid grid-cols-3 gap-3 border-t border-white/15 pt-4 text-xs">
        <div className="min-w-0">
          <dt className="truncate text-white/70">Avoidable cost</dt>
          <dd className="mt-0.5 truncate text-sm font-semibold">{formatInr(summary.pfPenalty)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="truncate text-white/70">Investment</dt>
          <dd className="mt-0.5 truncate text-sm font-semibold">
            {assumptions.capacitorCost ? formatInr(savings.capacitorCost) : '—'}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="truncate text-white/70">Payback</dt>
          <dd className="mt-0.5 truncate text-sm font-semibold">
            {savings.paybackMonths == null ? '—' : `${formatNumber(savings.paybackMonths, 1)} mo`}
          </dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={onOpen}
        className="relative mt-4 inline-flex items-center gap-1 rounded text-sm font-semibold text-white hover:underline
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        See opportunities
        <ArrowRight className="size-3.5" />
      </button>
    </section>
  );
}

/** One row per alert type with its count; a row opens the Alerts tab filtered to it. */
export function AlertSummaryCard({ alerts, onOpen }) {
  const high = alerts.items.filter((alert) => alert.severity === 'high').length;

  return (
    <section className="card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-base font-bold text-ink">Alerts</h2>
        <p className="text-xs text-subtle">
          <span className="font-semibold text-ink">{formatNumber(alerts.items.length)}</span> in all
          {high > 0 && (
            <>
              {' · '}
              <span className="font-semibold text-danger-fg">{high} high</span>
            </>
          )}
        </p>
      </div>

      <ul className="-mx-2 mt-3 space-y-0.5">
        {Object.entries(ALERT_TYPES).map(([type, { label }]) => {
          const count = alerts.counts[type] ?? 0;
          const IconComponent = ALERT_ICONS[type];
          return (
            <li key={type}>
              <button
                type="button"
                disabled={!count}
                onClick={() => onOpen(type)}
                className="focus-ring group flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition
                  enabled:hover:bg-hover disabled:cursor-default"
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-lg ring-1 ring-inset ${
                    count ? 'bg-warn-soft text-warn-fg ring-warn-line' : 'bg-sunken text-subtle ring-line'
                  }`}
                >
                  <IconComponent className="size-3.5" />
                </span>
                <span className={`min-w-0 flex-1 truncate ${count ? 'font-medium text-ink' : 'text-subtle'}`}>{label}</span>
                <span className={`num text-sm font-semibold ${count ? 'text-ink' : 'text-subtle'}`}>{count}</span>
                <ChevronRight className={`size-4 ${count ? 'text-subtle group-hover:text-ink' : 'invisible'}`} />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * A short ranked list with a bar per row, scaled to the top row. Rows with a
 * `to` link out (to a site or bill); the footer link opens the full tab.
 *
 * rows: [{ key, title, sub, value, share (0–100), tone?, to? }]
 */
export function RankCard({ title, description, rows, empty, more, onMore }) {
  return (
    <section className="card flex flex-col p-5">
      <h2 className="font-display text-base font-bold text-ink">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-subtle">{description}</p>}

      {rows.length ? (
        <ol className="mt-4 flex-1 space-y-3.5">
          {rows.map((row, index) => {
            const Title = row.to ? Link : 'span';
            return (
              <li key={row.key} className="min-w-0">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="num w-4 shrink-0 text-xs font-semibold text-subtle">{index + 1}</span>
                    <Title
                      {...(row.to && { to: row.to })}
                      className={`truncate font-medium text-ink ${row.to ? 'focus-ring rounded hover:text-accent-fg hover:underline' : ''}`}
                    >
                      {row.title}
                    </Title>
                  </span>
                  <span className="num shrink-0 font-semibold text-ink">{row.value}</span>
                </div>
                <div className="ml-6 mt-1.5 h-1.5 overflow-hidden rounded-full bg-sunken">
                  <div
                    className={`h-full rounded-full ${row.tone ?? 'bg-accent'}`}
                    style={{ width: `${Math.max(row.share, 2)}%` }}
                  />
                </div>
                {row.sub && <p className="ml-6 mt-1 truncate text-xs text-subtle">{row.sub}</p>}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="flex-1 py-8 text-center text-sm text-subtle">{empty}</p>
      )}

      <div className="mt-4 border-t border-line pt-3">
        <MoreLink onClick={onMore}>{more}</MoreLink>
      </div>
    </section>
  );
}
