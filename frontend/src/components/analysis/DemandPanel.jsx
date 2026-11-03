import { useMemo } from 'react';
import DataTable from './DataTable.jsx';
import Panel, { CsvButton, Pill } from './Panel.jsx';
import { BillLink, ConnectionCell } from './cells.jsx';
import { CD_ACTIONS } from '../../constants/analytics.constants.js';
import { connectionLabel, formatInr, formatMonth, formatNumber, siteLabel } from '../../utils/format.js';

/** How much of the contract demand the peak used, as a bar: amber when high, red when over. */
function Utilisation({ pct, highPct }) {
  const tone = pct > 100 ? 'bg-danger-fg' : pct >= highPct ? 'bg-warn-fg' : 'bg-accent';
  return (
    <div className="flex items-center justify-end gap-2">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-sunken ring-1 ring-inset ring-line">
        <span className={`block h-full rounded-full ${tone}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </span>
      <span className="num w-14 text-right">{formatNumber(pct, 1)}%</span>
    </div>
  );
}

const columnsFor = (highPct) => [
  {
    key: 'connection',
    label: 'Connection',
    render: (r) => <ConnectionCell connection={r} />,
    sort: (r) => siteLabel(r.site),
    csv: connectionLabel,
  },
  {
    key: 'cd',
    label: 'Contract demand',
    align: 'right',
    render: (r) => `${formatNumber(r.demand.contractDemand)} kVA`,
    sort: (r) => r.demand.contractDemand,
    csv: (r) => r.demand.contractDemand,
  },
  {
    key: 'peak',
    label: 'Peak MD',
    align: 'right',
    render: (r) => (
      <BillLink bill={r.demand.peakMd}>
        {formatNumber(r.demand.peakMd.value, 1)} kVA · {formatMonth(r.demand.peakMd.month)}
      </BillLink>
    ),
    sort: (r) => r.demand.peakMd.value,
    csv: (r) => r.demand.peakMd.value,
  },
  {
    key: 'avg',
    label: 'Average MD',
    align: 'right',
    render: (r) => `${formatNumber(r.demand.averageMd, 1)} kVA`,
    sort: (r) => r.demand.averageMd,
    csv: (r) => r.demand.averageMd,
  },
  {
    key: 'use',
    label: 'Peak ÷ CD',
    align: 'right',
    render: (r) => <Utilisation pct={r.demand.utilisationPct} highPct={highPct} />,
    sort: (r) => r.demand.utilisationPct,
    csv: (r) => r.demand.utilisationPct,
  },
  {
    key: 'exceeded',
    label: 'Months over CD',
    align: 'right',
    render: (r) => (
      <span className={r.demand.monthsExceeded ? 'font-semibold text-danger-fg' : ''}>
        {r.demand.monthsExceeded} of {r.demand.readings}
      </span>
    ),
    sort: (r) => r.demand.monthsExceeded,
    csv: (r) => r.demand.monthsExceeded,
  },
  {
    key: 'high',
    label: 'High MD months',
    align: 'right',
    render: (r) => r.demand.monthsHigh,
    sort: (r) => r.demand.monthsHigh,
    csv: (r) => r.demand.monthsHigh,
  },
  {
    key: 'recommended',
    label: 'Recommended CD',
    align: 'right',
    render: (r) => `${formatNumber(r.demand.recommendedCd)} kVA`,
    sort: (r) => r.demand.recommendedCd,
    csv: (r) => r.demand.recommendedCd,
  },
  {
    key: 'action',
    label: 'Advice',
    render: (r) => <Pill style={CD_ACTIONS[r.demand.action].style}>{CD_ACTIONS[r.demand.action].label}</Pill>,
    sort: (r) => r.demand.action,
    csv: (r) => CD_ACTIONS[r.demand.action].label,
  },
  {
    key: 'saving',
    label: 'Savings / year',
    align: 'right',
    render: (r) => formatInr(r.demand.potentialSavings),
    sort: (r) => r.demand.potentialSavings,
    csv: (r) => r.demand.potentialSavings,
  },
];

/**
 * Contract demand against the MD actually drawn, per connection, over its last
 * 12 months of bills. The recommended CD is the peak plus the headroom set in
 * Assumptions; a cut is only advised once there are six months of readings.
 */
export default function DemandPanel({ connections, assumptions }) {
  const rows = useMemo(() => connections.filter((c) => c.demand), [connections]);
  const columns = useMemo(() => columnsFor(assumptions.highMdPct), [assumptions.highMdPct]);

  return (
    <Panel
      title="Contract demand optimisation"
      description={`Recommended CD = peak MD of the last 12 months + ${assumptions.cdMarginPct}%`}
      actions={<CsvButton fileName="contract-demand.csv" columns={columns} rows={rows} />}
    >
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.key}
        initialSort={{ key: 'use', dir: 'desc' }}
        empty="No bills in this period have both contract demand and kVA MD filled in."
      />
    </Panel>
  );
}
