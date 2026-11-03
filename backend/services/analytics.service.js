import * as analyticsData from '../data/analytics.data.js';
import { addMonths, capacitorKvar, median, monthsBetween, percentChange } from '../utils/energy.js';

// Service layer for the Analysis dashboard. Verified bills number in the
// thousands at most, so they are loaded once per request and every figure is
// worked out here in plain JS — far easier to read and change than a dozen
// aggregation pipelines. `buildOverview` does the work and touches no
// database, so tests feed it bills directly.
//
// A "connection" is one electricity connection: a site plus a customer number.
// Contract demand, MD and power factor belong to a connection, not to a site.
//
// Three rules keep the figures honest on real, imperfect data:
// 1. A reading of 0 means "not entered" (kVAh, MD, PF, contract demand).
//    Consumption is the exception: 0 kWh is a real, if idle, month.
// 2. A bill whose readings look wrong (see checkReadings) still counts in
//    totals — it was billed — but draws no conclusions: it sets no lowest PF
//    or peak MD, raises no PF/MD/spike alert, and sizes no capacitor or
//    contract demand. It raises a "reading to check" alert instead.
// 3. Comparisons are like for like: a month is compared with another only over
//    the connections billed (with trusted readings) in both, so a bill not yet
//    uploaded never looks like a drop in consumption.

/** Thresholds and rates the dashboard lets the viewer set; these apply when they don't. */
export const DEFAULT_ASSUMPTIONS = {
  pfTarget: 0.95, // PF below this raises an alert and sizes capacitors
  highMdPct: 90, // MD at or above this share of contract demand counts as high
  spikePct: 20, // month-on-month kWh jump that counts as sudden
  cdMarginPct: 10, // headroom over the peak MD when recommending a contract demand
  capacitorCost: null, // ₹ per kVAR installed — needed for payback
  demandRate: null, // ₹ per kVA per month — needed to price a contract demand cut
};

const SEVERITY_RANK = { high: 0, medium: 1, low: 2 };

// Fewer MD readings than this and a lower contract demand is not recommended:
// a quiet few months says little about the year's peak.
const MIN_MONTHS_TO_REDUCE_CD = 6;
// A cut smaller than this share of contract demand isn't worth the paperwork.
const MIN_CD_CUT_PCT = 5;
// A connection needs this many bills before "far below its usual" means anything.
const MIN_BILLS_FOR_BASELINE = 3;
// kWh under this share of the connection's median month is checked, not trusted.
const LOW_READING_SHARE = 0.1;
// Rounding on a bill can nudge one figure past another; this much slack is allowed.
const READING_TOLERANCE = 1.01;
// The PF printed on a bill may differ from kWh ÷ kVAh by this much before it's queried.
const PF_MISMATCH = 0.05;

export const READING_ISSUES = {
  LOW_KWH: 'kWh far below this connection’s usual month',
  KWH_OVER_KVAH: 'kWh is higher than kVAh',
  KW_OVER_KVA: 'kW MD is higher than kVA MD',
  PF_MISMATCH: 'PF does not match kWh ÷ kVAh',
};

const round = (value, digits = 0) =>
  value == null || !Number.isFinite(value) ? null : Number(value.toFixed(digits));

const sum = (rows, pick) => rows.reduce((total, row) => total + (pick(row) ?? 0), 0);

const pickBest = (rows, pick, better) =>
  rows.reduce((best, row) => {
    const value = pick(row);
    return value != null && (best == null || better(value, pick(best))) ? row : best;
  }, null);
const minBy = (rows, pick) => pickBest(rows, pick, (a, b) => a < b);
const maxBy = (rows, pick) => pickBest(rows, pick, (a, b) => a > b);

const groupBy = (rows, key) => {
  const groups = new Map();
  for (const row of rows) {
    if (!groups.has(row[key])) groups.set(row[key], []);
    groups.get(row[key]).push(row);
  }
  return groups;
};

const byMonth = (a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0);

const trusted = (row) => row.issues.length === 0;

/** A positive reading, or null — on a bill form, 0 almost always means "left blank". */
const reading = (value) => (typeof value === 'number' && value > 0 ? value : null);

const toSite = (site) =>
  site ? { id: String(site._id), name: site.name, code: site.code || '', discom: site.discom || '' } : null;

/** One bill flattened to the numbers analysis reads. Missing readings are null, never zero. */
const toRow = (bill) => {
  const p = bill.parameters ?? {};
  const site = toSite(bill.site);
  const siteKey = site?.id ?? 'none';
  return {
    id: String(bill._id),
    site,
    siteKey,
    connection: `${siteKey}:${p.customerNumber ?? ''}`,
    customerNumber: p.customerNumber ?? '',
    consumerName: p.consumerName ?? '',
    month: p.billMonth,
    kwh: typeof p.kwhConsumption === 'number' && p.kwhConsumption >= 0 ? p.kwhConsumption : 0,
    kvah: reading(p.kvahConsumption),
    kvaMd: reading(p.kvaMd),
    kwMd: reading(p.kwMd),
    pf: reading(p.powerFactor),
    pfPenalty: typeof p.powerFactorPenalty === 'number' ? p.powerFactorPenalty : null,
    contractDemand: reading(p.contractDemand),
    savedAt: bill.submittedAt ?? bill.updatedAt ?? null,
    issues: [],
  };
};

/** One bill per connection and month — the latest saved. A bill uploaded twice would otherwise count twice. */
const dedupe = (rows) => {
  const latest = new Map();
  for (const row of rows) {
    const key = `${row.connection}|${row.month}`;
    const kept = latest.get(key);
    if (!kept || (row.savedAt ?? 0) > (kept.savedAt ?? 0)) latest.set(key, row);
  }
  return { rows: [...latest.values()], duplicates: rows.length - latest.size };
};

/**
 * Marks readings that can't be right, or sit too far from the connection's
 * usual month to be trusted. The usual month is the median of all its bills,
 * so one bad bill can't drag the baseline with it.
 */
const checkReadings = (rows) => {
  const usual = new Map();
  for (const [connection, bills] of groupBy(rows, 'connection')) {
    if (bills.length >= MIN_BILLS_FOR_BASELINE) usual.set(connection, median(bills.map((bill) => bill.kwh)));
  }

  for (const row of rows) {
    const typical = usual.get(row.connection);
    if (typical && row.kwh < typical * LOW_READING_SHARE) row.issues.push('LOW_KWH');
    if (row.kvah && row.kwh > row.kvah * READING_TOLERANCE) row.issues.push('KWH_OVER_KVAH');
    if (row.kwMd && row.kvaMd && row.kwMd > row.kvaMd * READING_TOLERANCE) row.issues.push('KW_OVER_KVA');
    if (row.pf && row.kvah && row.kwh && Math.abs(row.kwh / row.kvah - row.pf) > PF_MISMATCH) {
      row.issues.push('PF_MISMATCH');
    }
    row.usualKwh = typical ?? null;
  }
};

/** Enough of a bill for the dashboard to name it and link to it. */
const billRef = (row) => ({
  id: row.id,
  site: row.site,
  customerNumber: row.customerNumber,
  consumerName: row.consumerName,
  month: row.month,
});

const connectionRef = (row) => ({
  key: row.connection,
  site: row.site,
  customerNumber: row.customerNumber,
  consumerName: row.consumerName,
});

/** Real load in kW: the kW MD when the bill has it, else kVA MD × PF. */
const loadKw = (row) => row.kwMd ?? (row.kvaMd && row.pf ? row.kvaMd * row.pf : null);

/** Weighted PF over many bills: Σ kWh ÷ Σ kVAh, from trusted bills that report both. */
const averagePf = (rows) => {
  let kwh = 0;
  let kvah = 0;
  for (const row of rows) {
    if (!row.kvah || !trusted(row)) continue;
    kwh += row.kwh;
    kvah += row.kvah;
  }
  return kvah ? Math.min(kwh / kvah, 1) : null;
};

const summarize = (rows) => {
  const months = new Set(rows.map((row) => row.month)).size;
  const kwh = sum(rows, (row) => row.kwh);
  const sound = rows.filter(trusted);
  const lowestPf = minBy(sound, (row) => row.pf);
  const peakMd = maxBy(sound, (row) => row.kvaMd);

  return {
    bills: rows.length,
    sites: new Set(rows.filter((row) => row.site).map((row) => row.siteKey)).size,
    connections: new Set(rows.map((row) => row.connection)).size,
    months,
    kwh,
    kvah: sum(rows, (row) => row.kvah),
    avgMonthlyKwh: months ? round(kwh / months) : null,
    averagePf: round(averagePf(rows), 3),
    lowestPf: lowestPf && { ...billRef(lowestPf), value: lowestPf.pf },
    peakMd: peakMd && { ...billRef(peakMd), value: peakMd.kvaMd, contractDemand: peakMd.contractDemand },
    pfPenalty: sum(rows, (row) => Math.max(row.pfPenalty ?? 0, 0)),
    pfRebate: sum(rows, (row) => Math.max(-(row.pfPenalty ?? 0), 0)),
    billsToCheck: rows.length - sound.length,
  };
};

/**
 * Like-for-like change between two months: only connections billed, with
 * trusted readings, in both. null when no connection is in both.
 */
const likeForLike = (current, other) => {
  if (!current || !other) return null;
  let now = 0;
  let before = 0;
  let connections = 0;
  for (const [connection, row] of current) {
    const earlier = other.get(connection);
    if (!earlier || !trusted(row) || !trusted(earlier)) continue;
    now += row.kwh;
    before += earlier.kwh;
    connections += 1;
  }
  return connections ? { pct: round(percentChange(now, before), 1), connections } : null;
};

/**
 * kWh per month from `from` to `to`. Each month carries its totals, how many
 * connections were billed against how many existed by then, and like-for-like
 * changes on the month before and the same month a year earlier. Those
 * comparisons read every bill, not just the period's, so the period's first
 * month still has something to compare with. `kwh: null` = no bills that month.
 */
const buildTrend = (allRows, from, to) => {
  if (!from || !to) return [];

  const months = new Map(); // month -> Map(connection -> row)
  const firstBill = new Map(); // connection -> its first month
  for (const row of allRows) {
    if (!months.has(row.month)) months.set(row.month, new Map());
    months.get(row.month).set(row.connection, row);
    if (!firstBill.has(row.connection) || row.month < firstBill.get(row.connection)) {
      firstBill.set(row.connection, row.month);
    }
  }
  const total = (bills) => (bills ? sum([...bills.values()], (row) => row.kwh) : null);

  return monthsBetween(from, to).map((month) => {
    const current = months.get(month);
    const mom = likeForLike(current, months.get(addMonths(month, -1)));
    const yoy = likeForLike(current, months.get(addMonths(month, -12)));
    return {
      month,
      kwh: total(current),
      bills: current?.size ?? 0,
      expected: [...firstBill.values()].filter((first) => first <= month).length,
      previousKwh: total(months.get(addMonths(month, -1))),
      lastYearKwh: total(months.get(addMonths(month, -12))),
      momPct: mom?.pct ?? null,
      momConnections: mom?.connections ?? 0,
      yoyPct: yoy?.pct ?? null,
      yoyConnections: yoy?.connections ?? 0,
    };
  });
};

/**
 * The latest month against the one before and a year before, and the whole
 * period against a year earlier — all like for like (see likeForLike).
 */
const compare = (trend, rows, billAt) => {
  const latest = trend.findLast((month) => month.kwh != null);
  if (!latest) return null;

  let kwh = 0;
  let previousKwh = 0;
  let matchedBills = 0;
  for (const row of rows) {
    const lastYear = billAt.get(`${row.connection}|${addMonths(row.month, -12)}`);
    if (!lastYear || !trusted(row) || !trusted(lastYear)) continue;
    kwh += row.kwh;
    previousKwh += lastYear.kwh;
    matchedBills += 1;
  }

  return {
    latest: {
      month: latest.month,
      kwh: latest.kwh,
      bills: latest.bills,
      expected: latest.expected,
      previousMonth: addMonths(latest.month, -1),
      previousKwh: latest.previousKwh,
      momPct: latest.momPct,
      momConnections: latest.momConnections,
      lastYearMonth: addMonths(latest.month, -12),
      lastYearKwh: latest.lastYearKwh,
      yoyPct: latest.yoyPct,
      yoyConnections: latest.yoyConnections,
    },
    period: {
      from: trend[0].month,
      to: trend.at(-1).month,
      matchedBills,
      kwh,
      previousKwh: matchedBills ? previousKwh : null,
      yoyPct: matchedBills ? round(percentChange(kwh, previousKwh), 1) : null,
    },
  };
};

/**
 * Power factor and contract demand for one connection, over its last 12 months
 * of bills in the period. Savings are annualised from those months, so a
 * connection with three bills still gets a yearly estimate. Only trusted
 * readings size capacitors or contract demand.
 */
const analyseConnection = (rows, a) => {
  const sorted = [...rows].sort(byMonth);
  const latest = sorted.at(-1);
  const window = sorted.filter((row) => row.month > addMonths(latest.month, -12));
  const sound = sorted.filter(trusted);
  const soundWindow = window.filter(trusted);

  // Power factor: what lifting it to target would save, and the capacitors that takes.
  const lowest = minBy(sound, (row) => row.pf);
  const penalties = sum(window, (row) => Math.max(row.pfPenalty ?? 0, 0));
  const pfSavings = window.length ? (penalties / window.length) * 12 : 0;
  const kvar = Math.max(0, ...soundWindow.map((row) => capacitorKvar(loadKw(row), row.pf, a.pfTarget)));
  const capacitorCost = a.capacitorCost && kvar ? kvar * a.capacitorCost : null;

  // Contract demand: how much of it the peak MD uses, and what it should be.
  const contractDemand = sorted.findLast((row) => row.contractDemand)?.contractDemand ?? null;
  const readings = soundWindow.filter((row) => row.kvaMd != null);
  const peak = maxBy(readings, (row) => row.kvaMd);
  let demand = null;
  if (contractDemand && peak) {
    const cdOf = (row) => row.contractDemand || contractDemand;
    // Rounded before ceil: 50 × 1.1 is 55.000000000000007 in floating point, not 55.
    const recommendedCd = Math.ceil(round(peak.kvaMd * (1 + a.cdMarginPct / 100), 6));
    const exceeded = readings.filter((row) => row.kvaMd > cdOf(row)).length;
    const high = readings.filter(
      (row) => row.kvaMd <= cdOf(row) && row.kvaMd >= (cdOf(row) * a.highMdPct) / 100
    ).length;

    let action = 'ok';
    if (exceeded) action = 'increase';
    else if (recommendedCd <= contractDemand * (1 - MIN_CD_CUT_PCT / 100)) {
      action = readings.length >= MIN_MONTHS_TO_REDUCE_CD ? 'reduce' : 'more-data';
    }

    demand = {
      contractDemand,
      readings: readings.length,
      peakMd: { ...billRef(peak), value: peak.kvaMd },
      averageMd: round(sum(readings, (row) => row.kvaMd) / readings.length, 1),
      utilisationPct: round((peak.kvaMd / contractDemand) * 100, 1),
      monthsExceeded: exceeded,
      monthsHigh: high,
      recommendedCd,
      action,
      potentialSavings:
        action === 'reduce' && a.demandRate ? round((contractDemand - recommendedCd) * a.demandRate * 12) : null,
    };
  }

  return {
    ...connectionRef(latest),
    bills: sorted.length,
    windowMonths: window.length,
    latestMonth: latest.month,
    powerFactor: {
      latest: latest.pf,
      lowest: lowest && { ...billRef(lowest), value: lowest.pf },
      averagePf: round(averagePf(sorted), 3),
      billsBelowTarget: sound.filter((row) => row.pf != null && row.pf < a.pfTarget).length,
      penalty: sum(sorted, (row) => Math.max(row.pfPenalty ?? 0, 0)),
      potentialSavings: round(pfSavings),
      capacitorKvar: round(kvar, 1),
      capacitorCost: round(capacitorCost),
      paybackMonths: capacitorCost && pfSavings > 0 ? round(capacitorCost / (pfSavings / 12), 1) : null,
    },
    demand,
  };
};

/** Trusted bills below the PF target, worst first — each with what fixing it would take and save. */
const buildBelowTarget = (rows, a) =>
  rows
    .filter((row) => trusted(row) && row.pf != null && row.pf < a.pfTarget)
    .sort((x, y) => x.pf - y.pf || byMonth(y, x))
    .slice(0, 100)
    .map((row) => {
      const kw = loadKw(row);
      return {
        ...billRef(row),
        pf: row.pf,
        kw: round(kw, 1),
        kvar: round(capacitorKvar(kw, row.pf, a.pfTarget), 1),
        pfPenalty: row.pfPenalty,
        potentialSavings: Math.max(row.pfPenalty ?? 0, 0),
      };
    });

/**
 * Alerts for the period's bills, plus one "missing bill" alert per connection
 * with gaps. A gap is a month between a connection's first bill and the latest
 * month anyone has a bill for — so a connection that stopped uploading shows up.
 */
const buildAlerts = (rows, allRows, billAt, a, { from, to }) => {
  const alerts = [];
  const push = (type, severity, row, extra) =>
    alerts.push({ type, severity, month: row.month, bill: billRef(row), connection: connectionRef(row), ...extra });

  for (const row of rows) {
    // A penalty was charged whatever the readings say, so it is always reported.
    if (row.pfPenalty > 0) push('PF_PENALTY', 'high', row, { value: row.pfPenalty });

    if (!trusted(row)) {
      push('DATA_CHECK', 'low', row, { issues: row.issues, value: row.kwh, usual: row.usualKwh });
      continue;
    }

    if (row.pf != null && row.pf < a.pfTarget) {
      push('PF_LOW', row.pf < a.pfTarget - 0.05 ? 'high' : 'medium', row, { value: row.pf, threshold: a.pfTarget });
    }

    if (row.contractDemand && row.kvaMd != null) {
      if (row.kvaMd > row.contractDemand) {
        push('CD_EXCEEDED', 'high', row, { value: row.kvaMd, threshold: row.contractDemand });
      } else if (row.kvaMd >= (row.contractDemand * a.highMdPct) / 100) {
        push('HIGH_MD', 'medium', row, { value: row.kvaMd, threshold: row.contractDemand });
      }
    }

    const previous = billAt.get(`${row.connection}|${addMonths(row.month, -1)}`);
    if (previous && trusted(previous) && previous.kwh > 0 && row.kwh > previous.kwh * (1 + a.spikePct / 100)) {
      push('CONSUMPTION_SPIKE', 'medium', row, {
        value: row.kwh,
        previous: previous.kwh,
        changePct: round(percentChange(row.kwh, previous.kwh), 1),
      });
    }
  }

  const lastMonth = allRows.reduce((latest, row) => (row.month > latest ? row.month : latest), '');
  const end = to && to < lastMonth ? to : lastMonth;
  for (const bills of groupBy(allRows, 'connection').values()) {
    const first = bills.reduce((earliest, row) => (row.month < earliest ? row.month : earliest), lastMonth);
    const start = from && from > first ? from : first;
    if (start > end) continue;

    const missing = monthsBetween(start, end).filter((month) => !billAt.has(`${bills[0].connection}|${month}`));
    if (missing.length) {
      alerts.push({
        type: 'MISSING_BILL',
        severity: missing.length >= 3 ? 'high' : 'medium',
        month: missing.at(-1),
        bill: null,
        connection: connectionRef(bills[0]),
        months: missing,
      });
    }
  }

  alerts.sort(
    (x, y) =>
      (x.month < y.month ? 1 : x.month > y.month ? -1 : 0) || SEVERITY_RANK[x.severity] - SEVERITY_RANK[y.severity]
  );

  const counts = {};
  for (const alert of alerts) counts[alert.type] = (counts[alert.type] ?? 0) + 1;
  return { items: alerts, counts };
};

/** One row per site, so sites can be ranked against each other on any column. */
const buildBenchmark = (rows, connections, alerts) =>
  [...groupBy(rows, 'siteKey').entries()]
    .map(([siteKey, bills]) => {
      const summary = summarize(bills);
      const own = connections.filter((connection) => (connection.site?.id ?? 'none') === siteKey);
      const utilisation = own.map((c) => c.demand?.utilisationPct).filter((value) => value != null);

      return {
        site: bills[0].site, // null = bills not filed under a site yet
        bills: summary.bills,
        connections: summary.connections,
        months: summary.months,
        kwh: summary.kwh,
        avgMonthlyKwh: summary.avgMonthlyKwh,
        averagePf: summary.averagePf,
        lowestPf: summary.lowestPf,
        peakMd: summary.peakMd,
        maxUtilisationPct: utilisation.length ? Math.max(...utilisation) : null,
        pfPenalty: summary.pfPenalty,
        potentialSavings: sum(own, (c) => c.powerFactor.potentialSavings + (c.demand?.potentialSavings ?? 0)),
        alerts: alerts.filter((alert) => (alert.connection.site?.id ?? 'none') === siteKey).length,
      };
    })
    .sort((x, y) => y.kwh - x.kwh);

const totalSavings = (connections) => {
  const powerFactor = sum(connections, (c) => c.powerFactor.potentialSavings);
  const demand = sum(connections, (c) => c.demand?.potentialSavings);
  const capacitorCost = sum(connections, (c) => c.powerFactor.capacitorCost);
  return {
    powerFactor,
    demand,
    total: powerFactor + demand,
    capacitorKvar: round(sum(connections, (c) => c.powerFactor.capacitorKvar), 1),
    capacitorCost: capacitorCost || null,
    paybackMonths: capacitorCost && powerFactor ? round(capacitorCost / (powerFactor / 12), 1) : null,
  };
};

/**
 * Every figure on the Analysis page, from bill documents (as loaded, with
 * `site` populated). `from`/`to` (YYYY-MM) bound the period; leave both out
 * for all bills so far. Pure: no database, no clock.
 */
export const buildOverview = (bills, { from, to, ...overrides } = {}) => {
  const assumptions = { ...DEFAULT_ASSUMPTIONS };
  for (const [key, value] of Object.entries(overrides)) {
    if (key in DEFAULT_ASSUMPTIONS && value !== undefined && value !== null) assumptions[key] = value;
  }

  const { rows: allRows, duplicates } = dedupe(bills.filter((bill) => bill.parameters?.billMonth).map(toRow));
  checkReadings(allRows);
  const billAt = new Map(allRows.map((row) => [`${row.connection}|${row.month}`, row]));
  const rows = allRows.filter((row) => (!from || row.month >= from) && (!to || row.month <= to));

  const months = [...new Set(rows.map((row) => row.month))].sort();
  const allMonths = [...new Set(allRows.map((row) => row.month))].sort();

  const trend = buildTrend(allRows, months[0], months.at(-1));
  const connections = [...groupBy(rows, 'connection').values()]
    .map((connectionBills) => analyseConnection(connectionBills, assumptions))
    .sort((x, y) => y.powerFactor.potentialSavings - x.powerFactor.potentialSavings);
  const alerts = buildAlerts(rows, allRows, billAt, assumptions, { from, to });
  const summary = summarize(rows);

  return {
    period: { from: months[0] ?? null, to: months.at(-1) ?? null },
    available: { from: allMonths[0] ?? null, to: allMonths.at(-1) ?? null },
    assumptions,
    summary,
    trend,
    comparison: compare(trend, rows, billAt),
    powerFactor: { belowTarget: buildBelowTarget(rows, assumptions) },
    connections,
    savings: totalSavings(connections),
    alerts,
    benchmark: buildBenchmark(rows, connections, alerts.items),
    notes: { duplicates, billsToCheck: summary.billsToCheck },
  };
};

/** The Analysis page's data for verified bills matching the filters. */
export const getOverview = async ({ site, discom, organisation, state, consumerCategory, ...query }) =>
  buildOverview(
    await analyticsData.findVerifiedBills({ site, discom, organisation, state, consumerCategory }),
    query
  );
