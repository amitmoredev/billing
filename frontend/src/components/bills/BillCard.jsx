import { Link } from 'react-router-dom';
import { ChevronRight, FileText, Image as ImageIcon } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge.jsx';
import { formatBytes, formatDate, formatMonth, isPdf } from '../../utils/format.js';

/**
 * Column template shared by the table header and every row, so they stay
 * aligned. Below the `@3xl` container width a row collapses to bill + status.
 */
export const BILL_ROW_GRID =
  'grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 @3xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_100px_110px_140px_16px]';

/** Rows past this index skip the entrance animation — long lists shouldn't ripple. */
const ANIMATED_ROWS = 12;

export default function BillCard({ bill, index = 0 }) {
  const { parameters = {}, file } = bill;
  const pdf = isPdf(file.mimeType);
  const FileIcon = pdf ? FileText : ImageIcon;

  // The consumer's name once it is filled in; until then the file stands in.
  const title = parameters.consumerName || file.originalName;
  const subtitle = [parameters.consumerName && file.originalName, formatBytes(file.size)]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link
      to={`/bills/${bill.id}`}
      style={index < ANIMATED_ROWS ? { animationDelay: `${index * 35}ms` } : undefined}
      className={`focus-ring group relative grid px-5 py-3.5 transition hover:bg-hover lg:px-6
        ${index < ANIMATED_ROWS ? 'rise-in' : ''} ${BILL_ROW_GRID}`}
    >
      {/* Left accent that slides in on hover. */}
      <span
        aria-hidden
        className="absolute inset-y-2 left-0 w-0.75 origin-top scale-y-0 rounded-r-full bg-accent transition-transform
          duration-200 group-hover:scale-y-100"
      />

      <div className="flex min-w-0 items-center gap-3.5">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-xl ring-1 ring-inset
            ${pdf ? 'bg-danger-soft text-danger-fg ring-danger-line' : 'bg-accent-soft text-ink ring-accent-line'}`}
        >
          <FileIcon className="size-4.5" />
        </span>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{title}</p>
          <p className="mt-0.5 truncate text-xs text-subtle">{subtitle}</p>
        </div>
      </div>

      <p className="num hidden truncate text-sm text-muted @3xl:block">
        {parameters.customerNumber || '—'}
      </p>

      <p className="hidden whitespace-nowrap text-sm text-muted @3xl:block">
        {formatMonth(parameters.billMonth)}
      </p>

      <p className="hidden whitespace-nowrap text-sm text-muted @3xl:block">
        {formatDate(bill.uploadedAt || bill.createdAt)}
      </p>

      <div className="flex justify-end @3xl:justify-start">
        <StatusBadge status={bill.status} />
      </div>

      <ChevronRight
        className="hidden size-4 text-subtle transition group-hover:translate-x-0.5 group-hover:text-ink @3xl:block"
      />
    </Link>
  );
}
