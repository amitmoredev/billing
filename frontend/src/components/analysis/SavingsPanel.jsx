import { useMemo } from 'react';
import DataTable from './DataTable.jsx';
import Panel, { CsvButton, Figure, FigureStrip, Pill } from './Panel.jsx';
import { ConnectionCell } from './cells.jsx';
import { connectionLabel, formatInr, formatNumber, siteLabel } from '../../utils/format.js';

const KINDS = {
  pf: { label: 'Power factor', style: 'bg-accent-soft text-accent-fg ring-accent-line' },
  cd: { label: 'Contract demand', style: 'bg-warn-soft text-warn-fg ring-warn-line' },
};

const months = (value) => (value == null ? '—' : `${formatNumber(value, 1)} mo`);

/** Each connection's PF and contract demand findings, as actions with a price. */
const toOpportunities = (connections) =>
  connections.flatMap((c) => {
    const items = [];
    const pf = c.powerFactor;
    if (pf.potentialSavings > 0 || pf.capacitorKvar > 0) {
      items.push({
        id: `${c.key}:pf`,
        kind: 'pf',
        connection: c,
        action: pf.capacitorKvar
          ? `Install ~${formatNumber(pf.capacitorKvar, 1)} kVAR of capacitors`
          : 'Bring PF up to target',
        saving: pf.potentialSavings,
        investment: pf.capacitorCost,
        payback: pf.paybackMonths,
      });
    }
    const d = c.demand;
    if (d?.action === 'reduce' || d?.action === 'increase') {
      items.push({
        id: `${c.key}:cd`,
        kind: 'cd',
        connection: c,
        action:
          d.action === 'reduce'
            ? `Lower CD from ${formatNumber(d.contractDemand)} to ${formatNumber(d.recommendedCd)} kVA`
            : `Raise CD from ${formatNumber(d.contractDemand)} to ${formatNumber(d.recommendedCd)} kVA — MD went over ${d.monthsExceeded}×`,
        saving: d.potentialSavings,
        investment: null,
        payback: null,
      });
    }
    return items;
  });

const COLUMNS = [
  {
    key: 'kind',
    label: 'Area',
    render: (r) => <Pill style={KINDS[r.kind].style}>{KINDS[r.kind].label}</Pill>,
    csv: (r) => KINDS[r.kind].label,
  },
  {
    key: 'connection',
    label: 'Connection',
    render: (r) => <ConnectionCell connection={r.connection} />,
    sort: (r) => siteLabel(r.connection.site),
    csv: (r) => connectionLabel(r.connection),
  },
  { key: 'action', label: 'What to do', render: (r) => r.action, csv: (r) => r.action },
  {
    key: 'saving',
    label: 'Savings / year',
    align: 'right',
    render: (r) => (r.saving ? <span className="font-semibold text-ok-fg">{formatInr(r.saving)}</span> : '—'),
    sort: (r) => r.saving,
    csv: (r) => r.saving,
  },
  {
    key: 'investment',
    label: 'Investment',
    align: 'right',
    render: (r) => formatInr(r.investment),
    sort: (r) => r.investment,
    csv: (r) => r.investment,
  },
  { key: 'payback', label: 'Payback', align: 'right', render: (r) => months(r.payback), sort: (r) => r.payback, csv: (r) => r.payback },
];

/**
 * Financial impact: what was avoidable, what fixing it would save a year, and
 * what it would cost. Savings are annualised from each connection's last 12
 * months of bills; rates left blank in Assumptions leave their figures empty.
 */
export default function SavingsPanel({ summary, savings, connections, assumptions }) {
  const rows = useMemo(() => toOpportunities(connections), [connections]);

  return (
    <Panel
      title="Saving opportunities"
      actions={<CsvButton fileName="saving-opportunities.csv" columns={COLUMNS} rows={rows} />}
    >
      <FigureStrip>
        <Figure
          label="Avoidable cost"
          value={formatInr(summary.pfPenalty)}
          tone={summary.pfPenalty ? 'text-danger-fg' : 'text-ink'}
        />
        <Figure
          label="Estimated annual savings"
          value={formatInr(savings.total)}
          sub={`PF ${formatInr(savings.powerFactor)} · CD ${formatInr(savings.demand)}`}
          tone={savings.total ? 'text-ok-fg' : 'text-ink'}
        />
        <Figure
          label="Capacitor investment"
          value={formatInr(savings.capacitorCost)}
          sub={
            assumptions.capacitorCost
              ? `${formatNumber(savings.capacitorKvar, 1)} kVAR in all`
              : 'Set ₹/kVAR in Assumptions'
          }
        />
        <Figure label="Payback period" value={months(savings.paybackMonths)} />
      </FigureStrip>

      <DataTable
        columns={COLUMNS}
        rows={rows}
        rowKey={(r) => r.id}
        initialSort={{ key: 'saving', dir: 'desc' }}
        empty="No savings found: PF is at target and contract demand fits the load."
      />
    </Panel>
  );
}
