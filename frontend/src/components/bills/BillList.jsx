import { FileText, SearchX, TriangleAlert } from 'lucide-react';
import BillCard, { BILL_ROW_GRID } from './BillCard.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Spinner from '../ui/Spinner.jsx';

const COLUMNS = ['Bill', 'Consumer no.', 'Bill month', 'Uploaded', 'Status'];

/**
 * The bills table. A container, so its columns respond to the table's own
 * width rather than the window's — it stays readable however much room the
 * page gives it.
 */
export default function BillList({ bills, total, loading, error, filtered, toolbar }) {
  const showFooter = !loading && !error && bills.length > 0;

  return (
    <section className="card @container overflow-hidden">
      {toolbar && <div className="border-b border-line px-5 py-4 lg:px-6">{toolbar}</div>}

      <div className={`hidden border-b border-line bg-sunken px-5 py-3 @3xl:grid lg:px-6 ${BILL_ROW_GRID}`}>
        {COLUMNS.map((column) => (
          <span key={column} className="label-caps whitespace-nowrap">
            {column}
          </span>
        ))}
        <span />
      </div>

      <Body bills={bills} loading={loading} error={error} filtered={filtered} />

      {showFooter && (
        <p className="border-t border-line bg-sunken px-5 py-3 text-sm text-muted lg:px-6">
          Showing <span className="font-semibold text-ink">{bills.length}</span> of{' '}
          <span className="font-semibold text-ink">{total}</span> {total === 1 ? 'bill' : 'bills'}
        </p>
      )}
    </section>
  );
}

function Body({ bills, loading, error, filtered }) {
  if (loading) {
    return (
      <div className="grid place-items-center gap-3 py-20">
        <Spinner className="size-7" />
        <p className="text-sm font-medium text-subtle">Loading bills…</p>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState icon={TriangleAlert} title="Could not load bills" description={error.message} />
    );
  }

  if (!bills.length) {
    return filtered ? (
      <EmptyState
        icon={SearchX}
        title="No matching bills"
        description="Try a different search or status filter."
      />
    ) : (
      <EmptyState
        icon={FileText}
        title="No bills yet"
        description="Drop a PDF or photo of an electricity bill above to get started."
      />
    );
  }

  return (
    <div className="divide-y divide-line">
      {bills.map((bill, index) => (
        <BillCard key={bill.id} bill={bill} index={index} />
      ))}
    </div>
  );
}
