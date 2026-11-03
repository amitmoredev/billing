import { Link } from 'react-router-dom';
import { Activity, Gauge, IndianRupee, TrendingDown } from 'lucide-react';
import { useSitePaths } from '../../hooks/useSitePaths.js';
import { formatInr, formatMonth, formatNumber, formatPf, siteLabel } from '../../utils/format.js';

// PF meters span 0.80–1.00: below 0.8 is off the scale anyway, and a 0–1 bar
// would show every bill as nearly full.
const PF_FLOOR = 0.8;
const pfPosition = (pf) => Math.min(Math.max((pf - PF_FLOOR) / (1 - PF_FLOOR), 0), 1) * 100;

/** Power factor and demand at a glance. Lowest PF and peak MD open the bill they came from. */
export default function KpiTiles({ data }) {
  const paths = useSitePaths();
  const { summary, assumptions } = data;
  const target = assumptions.pfTarget;
  const where = (bill) => `${siteLabel(bill.site) || 'Unassigned'} · ${formatMonth(bill.month)}`;
  const peak = summary.peakMd;
  const peakShare = peak?.contractDemand ? (peak.value / peak.contractDemand) * 100 : null;

  const tiles = [
    {
      label: 'Average power factor',
      icon: Gauge,
      value: formatPf(summary.averagePf),
      sub: summary.averagePf == null ? 'Needs kVAh on bills' : `Target ${target}`,
      warn: summary.averagePf != null && summary.averagePf < target,
      meter: summary.averagePf != null && { fill: pfPosition(summary.averagePf), mark: pfPosition(target) },
    },
    {
      label: 'Lowest power factor',
      icon: TrendingDown,
      value: formatPf(summary.lowestPf?.value),
      sub: summary.lowestPf ? where(summary.lowestPf) : 'No PF recorded',
      to: summary.lowestPf && paths.bill(summary.lowestPf),
      warn: summary.lowestPf?.value < target,
      meter: summary.lowestPf && { fill: pfPosition(summary.lowestPf.value), mark: pfPosition(target) },
    },
    {
      label: 'Peak maximum demand',
      icon: Activity,
      value: formatNumber(peak?.value, 1),
      unit: 'kVA',
      sub: peak ? (peak.contractDemand ? `of ${formatNumber(peak.contractDemand)} kVA contract demand` : where(peak)) : 'No MD recorded',
      to: peak && paths.bill(peak),
      warn: peakShare > 100,
      // The bar runs to 125% of CD so an overshoot still shows past the 100% mark.
      meter: peakShare != null && { fill: Math.min(peakShare / 1.25, 100), mark: 80 },
    },
    {
      label: 'PF penalty charged',
      icon: IndianRupee,
      value: formatInr(summary.pfPenalty),
      sub: summary.pfRebate ? `${formatInr(summary.pfRebate)} rebate earned` : null,
      warn: summary.pfPenalty > 0,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
      {tiles.map((tile, index) => (
        <Tile key={tile.label} {...tile} index={index} />
      ))}
    </div>
  );
}

function Tile({ label, icon: IconComponent, value, unit, sub, to, warn, meter, index }) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm font-semibold text-muted">{label}</p>
        <span
          className={`grid size-8 shrink-0 place-items-center rounded-lg ring-1 ring-inset
            ${warn ? 'bg-warn-soft text-warn-fg ring-warn-line' : 'bg-accent-soft text-accent-fg ring-accent-line'}`}
        >
          <IconComponent className="size-4" />
        </span>
      </div>
      <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-subtle">{unit}</span>}
      </p>

      {meter && (
        <div className="relative mt-3 h-1.5 rounded-full bg-accent-soft ring-1 ring-inset ring-accent-line">
          <span
            className={`block h-full rounded-full ${warn ? 'bg-warn-fg' : 'bg-accent'}`}
            style={{ width: `${meter.fill}%` }}
          />
          {/* The line to beat: PF target, or 100% of contract demand. */}
          <span aria-hidden className="absolute -inset-y-1 w-0.5 rounded-full bg-ink/70" style={{ left: `${meter.mark}%` }} />
        </div>
      )}

      <p className="mt-2 truncate text-xs text-subtle" title={sub}>
        {sub}
      </p>
    </>
  );

  const className = 'card rise-in block min-w-0 p-4 sm:p-5';
  const style = { animationDelay: `${index * 40}ms` };

  return to ? (
    <Link to={to} style={style} className={`${className} focus-ring transition hover:-translate-y-0.5 hover:border-accent-line`}>
      {body}
    </Link>
  ) : (
    <div style={style} className={className}>
      {body}
    </div>
  );
}
