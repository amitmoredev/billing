import { BILL_STATUS, STATUS_LABELS } from '../../constants/bill.constants.js';

const STYLES = {
  [BILL_STATUS.SUBMITTED]: 'bg-ok-soft text-ok-fg ring-ok-line',
  [BILL_STATUS.UPLOADED]: 'bg-warn-soft text-warn-fg ring-warn-line',
  [BILL_STATUS.PENDING_UPLOAD]: 'bg-neutral-soft text-neutral-fg ring-neutral-line',
};

export default function StatusBadge({ status, className = '' }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold
        tracking-wide ring-1 ring-inset ${STYLES[status] || STYLES.PENDING_UPLOAD} ${className}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status] || status}
    </span>
  );
}
