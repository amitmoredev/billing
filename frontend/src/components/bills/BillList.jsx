import { useEffect, useRef } from 'react';
import { FileText, SearchX, TriangleAlert } from 'lucide-react';
import BillCard, { BILL_ROW_GRID } from './BillCard.jsx';
import Button from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Spinner from '../ui/Spinner.jsx';

const COLUMNS = ['Bill', 'Consumer no.', 'Bill month', 'Uploaded', 'Status'];

/**
 * The bills table. A container, so its columns respond to the table's own
 * width rather than the window's — it stays readable however much room the
 * page gives it. `billHref(bill)` says where each row opens; `emptyHint`
 * replaces the "no bills yet" line.
 *
 * Bills arrive in batches: while `hasMore`, reaching the bottom of the list
 * calls `onLoadMore` for the next one.
 */
export default function BillList({
  bills,
  total,
  loading,
  error,
  filtered,
  toolbar,
  billHref,
  emptyHint,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}) {
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

      <Body
        bills={bills}
        loading={loading}
        error={error}
        filtered={filtered}
        billHref={billHref}
        emptyHint={emptyHint}
      />

      {showFooter && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-sunken px-5 py-3 lg:px-6">
          <p className="text-sm text-muted">
            Showing <span className="font-semibold text-ink">{bills.length}</span> of{' '}
            <span className="font-semibold text-ink">{total}</span> {total === 1 ? 'bill' : 'bills'}
          </p>
          <LoadMore hasMore={hasMore} loading={loadingMore} onLoadMore={onLoadMore} />
        </div>
      )}
    </section>
  );
}

/**
 * Loads the next batch as soon as it scrolls near the viewport. The button is
 * there for keyboards and for when the observer can't fire (e.g. a very tall
 * screen that already shows everything loaded).
 */
function LoadMore({ hasMore, loading, onLoadMore }) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || loading) return undefined;

    // Re-created after every batch, so if the sentinel is still on screen
    // (a short page) it asks again until the screen fills or bills run out.
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && onLoadMore(), {
      rootMargin: '0px 0px 320px 0px', // start a little before the bottom is reached
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  if (!hasMore) return <span className="text-xs font-medium text-subtle">That&apos;s everything</span>;

  return (
    <div ref={sentinelRef}>
      <Button variant="secondary" size="sm" loading={loading} onClick={onLoadMore}>
        {loading ? 'Loading…' : 'Load more'}
      </Button>
    </div>
  );
}

function Body({ bills, loading, error, filtered, billHref, emptyHint }) {
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
        description={emptyHint ?? 'Drop a PDF or photo of an electricity bill above to get started.'}
      />
    );
  }

  return (
    <div className="divide-y divide-line">
      {bills.map((bill, index) => (
        <BillCard key={bill.id} bill={bill} to={billHref(bill)} index={index} />
      ))}
    </div>
  );
}
