import DataTable from './DataTable.jsx';
import Panel, { CsvButton, Figure, FigureStrip } from './Panel.jsx';
import { BillLink, ConnectionCell } from './cells.jsx';
import { connectionLabel, formatInr, formatMonth, formatNumber, formatPf, siteLabel } from '../../utils/format.js';

const COLUMNS = [
  {
    key: 'connection',
    label: 'Connection',
    render: (r) => <ConnectionCell connection={r} />,
    sort: (r) => siteLabel(r.site),
    csv: connectionLabel,
  },
  {
    key: 'month',
    label: 'Bill',
    render: (r) => <BillLink bill={r}>{formatMonth(r.month)}</BillLink>,
    sort: (r) => r.month,
    csv: (r) => r.month,
  },
  { key: 'pf', label: 'PF', align: 'right', render: (r) => formatPf(r.pf), sort: (r) => r.pf, csv: (r) => r.pf },
  { key: 'kw', label: 'Load kW', align: 'right', render: (r) => formatNumber(r.kw, 1), sort: (r) => r.kw, csv: (r) => r.kw },
  {
    key: 'kvar',
    label: 'kVAr Required',
    align: 'right',
    render: (r) => formatNumber(r.kvar, 1),
    sort: (r) => r.kvar,
    csv: (r) => r.kvar,
  },
  {
    key: 'pfPenalty',
    label: 'Penalty charged',
    align: 'right',
    render: (r) => formatInr(r.pfPenalty),
    sort: (r) => r.pfPenalty,
    csv: (r) => r.pfPenalty,
  },
  {
    key: 'potentialSavings',
    label: 'Potential savings',
    align: 'right',
    render: (r) => <span className="font-semibold text-ok-fg">{formatInr(r.potentialSavings)}</span>,
    sort: (r) => r.potentialSavings,
    csv: (r) => r.potentialSavings,
  },
];

/**
 * Bills below the PF target, worst first. The penalty on each is what lifting
 * its PF to target would have saved; kVAr Required is the capacitor bank that would do it.
 */
export default function PowerFactorPanel({ summary, belowTarget, pfTarget }) {
  const penalised = belowTarget.filter((bill) => bill.pfPenalty > 0).length;

  return (
    <Panel
      title="Power factor"
      description={`Bills below ${pfTarget}, worst first`}
      actions={<CsvButton fileName="power-factor.csv" columns={COLUMNS} rows={belowTarget} />}
    >
      <FigureStrip>
        <Figure
          label="Lowest recorded PF"
          value={summary.lowestPf ? <BillLink bill={summary.lowestPf}>{formatPf(summary.lowestPf.value)}</BillLink> : '—'}
          sub={summary.lowestPf && `${siteLabel(summary.lowestPf.site) || 'Unassigned'} · ${formatMonth(summary.lowestPf.month)}`}
        />
        <Figure label="Bills below target" value={formatNumber(belowTarget.length)} sub={`${penalised} with a penalty`} />
        <Figure
          label="PF penalty charged"
          value={formatInr(summary.pfPenalty)}
          tone={summary.pfPenalty ? 'text-danger-fg' : 'text-ink'}
        />
        <Figure label="PF rebate earned" value={formatInr(summary.pfRebate)} tone={summary.pfRebate ? 'text-ok-fg' : 'text-ink'} />
      </FigureStrip>

      <DataTable
        columns={COLUMNS}
        rows={belowTarget}
        rowKey={(r) => r.id}
        empty={`Every bill in this period meets the ${pfTarget} target.`}
      />
    </Panel>
  );
}
