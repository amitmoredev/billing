import { Download } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { downloadCsv } from '../../utils/csv.js';

/** A titled card for one section of the Analysis page. `actions` sit at the header's right. */
export default function Panel({ title, description, actions, children, className = '' }) {
  return (
    <section className={`card min-w-0 overflow-hidden ${className}`}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold text-ink">{title}</h2>
          {description && <p className="mt-0.5 max-w-3xl text-sm text-muted">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </header>
      {children}
    </section>
  );
}

/** Downloads the rows behind a table, using the columns that say how to write themselves (`csv`). */
export function CsvButton({ fileName, columns, rows }) {
  return (
    <Button
      variant="secondary"
      size="sm"
      icon={Download}
      disabled={!rows.length}
      onClick={() =>
        downloadCsv(
          fileName,
          columns.filter((column) => column.csv),
          rows
        )
      }
    >
      CSV
    </Button>
  );
}

/** A small figure with its label, for the strip at the top of a panel. */
export function Figure({ label, value, sub, tone = 'text-ink' }) {
  return (
    <div className="min-w-0">
      <p className="label-caps truncate">{label}</p>
      <p className={`num mt-1 truncate text-xl font-semibold ${tone}`}>{value}</p>
      {sub && <p className="mt-0.5 truncate text-xs text-subtle">{sub}</p>}
    </div>
  );
}

/** A row of Figures under a panel's header. */
export function FigureStrip({ children }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-b border-line px-5 py-4 lg:grid-cols-4">{children}</div>
  );
}

/** A rounded label like the status badges, in whatever tone `style` gives it. */
export function Pill({ style, children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style}`}
    >
      {children}
    </span>
  );
}
