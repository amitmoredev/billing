import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { buildOverview } from '../services/analytics.service.js';
import { addMonths, capacitorKvar, median, monthsBetween } from '../utils/energy.js';

// Bills are built the way Mongo returns them (`site` populated), so these
// tests exercise exactly what the API does, minus the query.

const SITE_A = { _id: 'a'.repeat(24), name: 'Plant A', code: 'PA', discom: 'MSEDCL' };
const SITE_B = { _id: 'b'.repeat(24), name: 'Plant B', code: '', discom: 'TPC' };

let seq = 0;
const bill = (site, customerNumber, billMonth, parameters = {}, savedAt) => {
  seq += 1;
  return {
    _id: String(seq).padStart(24, '0'),
    site,
    submittedAt: savedAt ?? new Date(2026, 0, 1, 0, 0, seq),
    parameters: { customerNumber, consumerName: 'Test', billMonth, kwhConsumption: 1000, ...parameters },
  };
};

/** A normal month for a connection: 1,000 kWh at PF 0.98, MD 80 of a 100 kVA CD. */
const normal = (site, number, month, extra = {}) =>
  bill(site, number, month, {
    kwhConsumption: 1000,
    kvahConsumption: 1020,
    powerFactor: 0.98,
    kvaMd: 80,
    kwMd: 78,
    contractDemand: 100,
    ...extra,
  });

const months = (from, count) => monthsBetween(from, addMonths(from, count - 1));
const alertsOf = (overview, type) => overview.alerts.items.filter((alert) => alert.type === type);

describe('energy helpers', () => {
  test('month arithmetic crosses year ends both ways', () => {
    assert.equal(addMonths('2025-12', 1), '2026-01');
    assert.equal(addMonths('2026-01', -1), '2025-12');
    assert.equal(addMonths('2026-03', -12), '2025-03');
    assert.deepEqual(monthsBetween('2025-11', '2026-02'), ['2025-11', '2025-12', '2026-01', '2026-02']);
  });

  test('capacitor sizing uses kW × (tan φ1 − tan φ2)', () => {
    // 100 kW from 0.80 to 0.95: 100 × (0.75 − 0.3287) ≈ 42.13 kVAR.
    assert.ok(Math.abs(capacitorKvar(100, 0.8, 0.95) - 42.13) < 0.01);
    assert.equal(capacitorKvar(100, 0.96, 0.95), 0);
    assert.equal(capacitorKvar(null, 0.8, 0.95), 0);
  });

  test('median', () => {
    assert.equal(median([5, 1, 3]), 3);
    assert.equal(median([4, 1, 3, 2]), 2.5);
    assert.equal(median([]), null);
  });
});

describe('totals', () => {
  test('sums kWh and counts bills, sites and connections', () => {
    const o = buildOverview([
      normal(SITE_A, '1', '2026-01'),
      normal(SITE_A, '2', '2026-01', { kwhConsumption: 500, kvahConsumption: 510 }),
      normal(SITE_B, '9', '2026-02'),
    ]);
    assert.equal(o.summary.kwh, 2500);
    assert.equal(o.summary.bills, 3);
    assert.equal(o.summary.sites, 2);
    assert.equal(o.summary.connections, 3);
    assert.equal(o.summary.months, 2);
  });

  test('a bill uploaded twice counts once — the latest saved', () => {
    const o = buildOverview([
      bill(SITE_A, '1', '2026-01', { kwhConsumption: 100 }, new Date(2026, 0, 1)),
      bill(SITE_A, '1', '2026-01', { kwhConsumption: 120 }, new Date(2026, 0, 5)),
    ]);
    assert.equal(o.summary.kwh, 120);
    assert.equal(o.notes.duplicates, 1);
  });

  test('average PF is Σ kWh ÷ Σ kVAh, not a mean of PFs', () => {
    const o = buildOverview([
      normal(SITE_A, '1', '2026-01', { kwhConsumption: 9000, kvahConsumption: 10000, powerFactor: 0.9 }),
      normal(SITE_A, '2', '2026-01', { kwhConsumption: 1000, kvahConsumption: 1000, powerFactor: 1 }),
    ]);
    assert.equal(o.summary.averagePf, 0.909); // 10000 ÷ 11000; a plain mean would say 0.95
  });

  test('the period filter bounds totals', () => {
    const bills = months('2025-01', 6).map((m) => normal(SITE_A, '1', m));
    const o = buildOverview(bills, { from: '2025-03', to: '2025-04' });
    assert.equal(o.summary.bills, 2);
    assert.deepEqual(o.period, { from: '2025-03', to: '2025-04' });
    assert.deepEqual(o.available, { from: '2025-01', to: '2025-06' });
  });

  test('no bills at all is an empty overview, not a crash', () => {
    const o = buildOverview([]);
    assert.equal(o.summary.bills, 0);
    assert.deepEqual(o.trend, []);
    assert.equal(o.comparison, null);
    assert.equal(o.summary.lowestPf, null);
  });
});

describe('zero readings mean "not entered"', () => {
  test('MD 0 is neither the peak nor part of the average', () => {
    const bills = months('2025-01', 6).map((m, i) =>
      normal(SITE_A, '1', m, { kvaMd: i === 2 ? 0 : 80, kwMd: i === 2 ? 0 : 78 })
    );
    const o = buildOverview(bills);
    assert.equal(o.connections[0].demand.averageMd, 80);
    assert.equal(o.connections[0].demand.readings, 5);
  });

  test('kVAh 0 is left out of average PF', () => {
    const o = buildOverview([
      normal(SITE_A, '1', '2026-01', { kwhConsumption: 950, kvahConsumption: 1000, powerFactor: 0.95 }),
      normal(SITE_A, '2', '2026-01', { kvahConsumption: 0 }),
    ]);
    assert.equal(o.summary.averagePf, 0.95);
  });
});

describe('readings to check', () => {
  const history = (extra) => months('2025-01', 6).map((m) => normal(SITE_A, '1', m, extra?.(m)));

  test('a month far below the usual is flagged and draws no conclusions', () => {
    const bills = history((m) =>
      m === '2025-04' ? { kwhConsumption: 2, kvahConsumption: 5, powerFactor: 0.4, kvaMd: 1, kwMd: 1 } : {}
    );
    const o = buildOverview(bills);

    const checks = alertsOf(o, 'DATA_CHECK');
    assert.equal(checks.length, 1);
    assert.deepEqual(checks[0].issues, ['LOW_KWH']);
    // Still billed, so still in the total…
    assert.equal(o.summary.kwh, 5 * 1000 + 2);
    // …but not the lowest PF, not a PF alert, and the next month is no "spike".
    assert.equal(o.summary.lowestPf.value, 0.98);
    assert.equal(alertsOf(o, 'PF_LOW').length, 0);
    assert.equal(alertsOf(o, 'CONSUMPTION_SPIKE').length, 0);
    assert.equal(o.powerFactor.belowTarget.length, 0);
  });

  test('kWh above kVAh and kW MD above kVA MD are flagged', () => {
    const o = buildOverview([
      normal(SITE_A, '1', '2026-01', { kwhConsumption: 1100, kvahConsumption: 1000, powerFactor: 1 }),
      normal(SITE_A, '2', '2026-01', { kwMd: 90, kvaMd: 80 }),
    ]);
    const issues = alertsOf(o, 'DATA_CHECK').flatMap((alert) => alert.issues).sort();
    // 1,100 ÷ 1,000 = 1.1 also disagrees with the printed PF of 1.
    assert.deepEqual(issues, ['KWH_OVER_KVAH', 'KW_OVER_KVA', 'PF_MISMATCH']);
    assert.equal(o.summary.billsToCheck, 2);
  });

  test('rounding on a bill (under 1%) is not flagged', () => {
    const o = buildOverview([normal(SITE_A, '1', '2026-01', { kwhConsumption: 8812, kvahConsumption: 8782, powerFactor: 0.99 })]);
    assert.equal(alertsOf(o, 'DATA_CHECK').length, 0);
  });

  test('a penalty is reported even on a bill with readings to check', () => {
    const o = buildOverview([
      normal(SITE_A, '1', '2026-01', { kwhConsumption: 1100, kvahConsumption: 1000, powerFactorPenalty: 500 }),
    ]);
    assert.equal(alertsOf(o, 'PF_PENALTY').length, 1);
  });
});

describe('comparisons are like for like', () => {
  test('a month half uploaded is compared only on the connections it has', () => {
    const bills = [
      normal(SITE_A, '1', '2026-08', { kwhConsumption: 1000, kvahConsumption: 1020 }),
      normal(SITE_A, '2', '2026-08', { kwhConsumption: 9000, kvahConsumption: 9180 }),
      normal(SITE_A, '1', '2026-09', { kwhConsumption: 1100, kvahConsumption: 1122 }), // '2' not uploaded yet
    ];
    const { latest } = buildOverview(bills).comparison;
    assert.equal(latest.momPct, 10); // 1,100 vs 1,000 — not 1,100 vs 10,000
    assert.equal(latest.momConnections, 1);
    assert.equal(latest.bills, 1);
    assert.equal(latest.expected, 2);
  });

  test('period year-on-year matches each bill with the same connection a year earlier', () => {
    const bills = [
      ...months('2025-01', 12).map((m) => normal(SITE_A, '1', m, { kwhConsumption: 1000, kvahConsumption: 1020 })),
      ...months('2026-01', 12).map((m) => normal(SITE_A, '1', m, { kwhConsumption: 1100, kvahConsumption: 1122 })),
      // A connection that only started this year has nothing to compare with.
      ...months('2026-01', 12).map((m) => normal(SITE_B, '9', m, { kwhConsumption: 50000, kvahConsumption: 51000 })),
    ];
    const { period } = buildOverview(bills, { from: '2026-01', to: '2026-12' }).comparison;
    assert.equal(period.matchedBills, 12);
    assert.equal(period.yoyPct, 10);
  });

  test('the first month of a period still compares with the month before it', () => {
    const bills = [normal(SITE_A, '1', '2026-02', { kwhConsumption: 800, kvahConsumption: 816 }), normal(SITE_A, '1', '2026-03')];
    const o = buildOverview(bills, { from: '2026-03', to: '2026-03' });
    assert.equal(o.trend[0].momPct, 25);
  });
});

describe('alerts', () => {
  test('PF below target: high when 0.05 or more under', () => {
    const o = buildOverview([
      normal(SITE_A, '1', '2026-01', { kwhConsumption: 930, kvahConsumption: 1000, powerFactor: 0.93 }),
      normal(SITE_A, '2', '2026-01', { kwhConsumption: 880, kvahConsumption: 1000, powerFactor: 0.88 }),
    ]);
    const severities = alertsOf(o, 'PF_LOW').map((alert) => alert.severity).sort();
    assert.deepEqual(severities, ['high', 'medium']);
  });

  test('MD over CD is exceeded; at 90%+ of CD it is high', () => {
    const o = buildOverview([
      normal(SITE_A, '1', '2026-01', { kvaMd: 110, kwMd: 100 }),
      normal(SITE_A, '2', '2026-01', { kvaMd: 95, kwMd: 90 }),
      normal(SITE_A, '3', '2026-01', { kvaMd: 70, kwMd: 68 }),
    ]);
    assert.equal(alertsOf(o, 'CD_EXCEEDED').length, 1);
    assert.equal(alertsOf(o, 'HIGH_MD').length, 1);
  });

  test('a jump over the threshold on the same connection is a spike', () => {
    const o = buildOverview([
      normal(SITE_A, '1', '2026-01'),
      normal(SITE_A, '1', '2026-02', { kwhConsumption: 1300, kvahConsumption: 1326 }),
      normal(SITE_A, '2', '2026-02', { kwhConsumption: 5000, kvahConsumption: 5100 }), // new connection: no spike
    ]);
    const spikes = alertsOf(o, 'CONSUMPTION_SPIKE');
    assert.equal(spikes.length, 1);
    assert.equal(spikes[0].changePct, 30);
  });

  test('missing bills: gaps since the first bill, up to the latest month on record', () => {
    const o = buildOverview([
      normal(SITE_A, '1', '2026-01'),
      normal(SITE_A, '1', '2026-04'),
      normal(SITE_B, '9', '2026-05'),
    ]);
    const missing = alertsOf(o, 'MISSING_BILL');
    assert.equal(missing.length, 1);
    assert.deepEqual(missing[0].months, ['2026-02', '2026-03', '2026-05']);
    assert.equal(missing[0].severity, 'high');
  });

  test('missing bills respect the period', () => {
    const o = buildOverview([normal(SITE_A, '1', '2026-01'), normal(SITE_A, '1', '2026-06')], {
      from: '2026-04',
      to: '2026-06',
    });
    assert.deepEqual(alertsOf(o, 'MISSING_BILL')[0].months, ['2026-04', '2026-05']);
  });

  test('thresholds follow the assumptions passed in', () => {
    const bills = [normal(SITE_A, '1', '2026-01', { kwhConsumption: 930, kvahConsumption: 1000, powerFactor: 0.93 })];
    assert.equal(alertsOf(buildOverview(bills), 'PF_LOW').length, 1);
    assert.equal(alertsOf(buildOverview(bills, { pfTarget: 0.9 }), 'PF_LOW').length, 0);
    assert.equal(buildOverview(bills, { bogus: 1 }).assumptions.bogus, undefined);
  });
});

describe('contract demand advice', () => {
  const year = (md, cd = 100, count = 12) =>
    months('2025-01', count).map((m) => normal(SITE_A, '1', m, { kvaMd: md, kwMd: md * 0.97, contractDemand: cd }));

  test('MD over CD in any month says increase, to peak + headroom', () => {
    const bills = year(80);
    bills[5].parameters.kvaMd = 120;
    const { demand } = buildOverview(bills).connections[0];
    assert.equal(demand.action, 'increase');
    assert.equal(demand.recommendedCd, 132);
    assert.equal(demand.monthsExceeded, 1);
  });

  test('a well oversized CD with a year of readings says reduce, priced by the demand rate', () => {
    const { demand } = buildOverview(year(50), { demandRate: 300 }).connections[0];
    assert.equal(demand.action, 'reduce');
    assert.equal(demand.recommendedCd, 55);
    assert.equal(demand.potentialSavings, (100 - 55) * 300 * 12);
  });

  test('a cut under 5% of CD is not worth advising', () => {
    const { demand } = buildOverview(year(87)).connections[0]; // 87 × 1.1 = 96 → only 4% under 100
    assert.equal(demand.action, 'ok');
  });

  test('under six months of readings, no cut is advised yet', () => {
    const { demand } = buildOverview(year(50, 100, 4)).connections[0];
    assert.equal(demand.action, 'more-data');
  });

  test('only the last 12 months of the connection count', () => {
    const bills = year(50, 100, 24);
    bills[0].parameters.kvaMd = 150; // two years back — outside the window
    const { demand } = buildOverview(bills).connections[0];
    assert.equal(demand.peakMd.value, 50);
  });
});

describe('power factor savings', () => {
  test('penalties are annualised and sized capacitors give a payback', () => {
    const bills = months('2025-01', 6).map((m) =>
      normal(SITE_A, '1', m, {
        kwhConsumption: 900,
        kvahConsumption: 1000,
        powerFactor: 0.9,
        kvaMd: 100,
        kwMd: 90,
        powerFactorPenalty: 1000,
      })
    );
    const { powerFactor } = buildOverview(bills, { capacitorCost: 1000 }).connections[0];
    assert.equal(powerFactor.potentialSavings, 12000); // ₹1,000 a month × 12
    // 90 kW from 0.90 to 0.95: 90 × (0.4843 − 0.3287) ≈ 14.0 kVAR → ₹14,005 → 14 months.
    assert.equal(powerFactor.capacitorKvar, 14);
    assert.equal(powerFactor.paybackMonths, 14);
  });

  test('a rebate is not a saving', () => {
    const o = buildOverview([normal(SITE_A, '1', '2026-01', { powerFactorPenalty: -200 })]);
    assert.equal(o.summary.pfRebate, 200);
    assert.equal(o.summary.pfPenalty, 0);
    assert.equal(o.savings.total, 0);
  });
});
