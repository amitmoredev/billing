import { formatNumber, formatPf, siteLabel } from '../../utils/format.js';

// Rows for the Overview's ranked cards (see RankCard in OverviewCards.jsx).

/** Top sites by kWh. */
export const topSitesRows = (benchmark, sitePath) => {
  const top = benchmark.slice(0, 5);
  const max = top[0]?.kwh || 1;
  return top.map((site) => ({
    key: site.site?.id ?? 'none',
    title: siteLabel(site.site) || 'Unassigned bills',
    value: `${formatNumber(site.kwh)} kWh`,
    share: (site.kwh / max) * 100,
    to: sitePath(site.site?.id),
  }));
};

/** Connections whose PF falls furthest below target, by their lowest bill. */
export const worstPfRows = (connections, target, billPath) =>
  connections
    .filter((c) => c.powerFactor.lowest && c.powerFactor.lowest.value < target)
    .sort((a, b) => a.powerFactor.lowest.value - b.powerFactor.lowest.value)
    .slice(0, 5)
    .map((c) => ({
      key: c.key,
      title: siteLabel(c.site) || 'Unassigned',
      value: formatPf(c.powerFactor.lowest.value),
      // How far below target, on the 0.80–target scale: a longer bar is worse.
      share: Math.min(((target - c.powerFactor.lowest.value) / (target - 0.8)) * 100, 100),
      tone: 'bg-warn-fg',
      to: billPath(c.powerFactor.lowest),
    }));

/** Connections drawing the largest share of their contract demand. */
export const demandRows = (connections, billPath) =>
  connections
    .filter((c) => c.demand)
    .sort((a, b) => b.demand.utilisationPct - a.demand.utilisationPct)
    .slice(0, 5)
    .map((c) => ({
      key: c.key,
      title: siteLabel(c.site) || 'Unassigned',
      value: `${formatNumber(c.demand.utilisationPct, 1)}%`,
      share: Math.min(c.demand.utilisationPct, 100),
      tone: c.demand.utilisationPct > 100 ? 'bg-danger-fg' : 'bg-accent',
      to: billPath(c.demand.peakMd),
    }));
