import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge.jsx';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { useDeleteBill } from '../../queries/bill.query.js';
import { useToast } from '../../context/toast.context.js';

export default function BillDetailHeader({ bill }) {
  const navigate = useNavigate();
  const remove = useDeleteBill();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const consumerName = bill.parameters?.consumerName;

  const handleDelete = () => {
    remove.mutate(bill.id, {
      onSuccess: () => {
        toast.success('Bill deleted', bill.file.originalName);
        navigate('/bills');
      },
      onError: (err) => {
        setConfirming(false);
        toast.error('Could not delete bill', err.message);
      },
    });
  };

  return (
    <header className="flex h-18 shrink-0 items-center gap-3.5 border-b border-line bg-surface px-4 lg:px-6">
      <Link
        to="/bills"
        className="focus-ring grid size-10 shrink-0 place-items-center rounded-xl border border-line text-muted
          transition hover:border-line-strong hover:bg-hover hover:text-ink"
        aria-label="Back to bills"
      >
        <ArrowLeft className="size-5" />
      </Link>

      <div className="min-w-0 flex-1 leading-tight">
        <h1 className="truncate font-display text-lg font-bold tracking-tight text-ink">
          {consumerName || bill.file.originalName}
        </h1>
        <p className="truncate text-sm text-subtle">
          {consumerName ? bill.file.originalName : 'Consumer name not filled in yet'}
        </p>
      </div>

      <StatusBadge status={bill.status} />

      <Button
        variant="danger"
        size="sm"
        icon={Trash2}
        onClick={() => setConfirming(true)}
        aria-label="Delete bill"
      >
        <span className="hidden sm:inline">Delete</span>
      </Button>

      {confirming && (
        <ConfirmDialog
          title="Delete bill"
          message="This bill and its file will be deleted permanently. This cannot be undone."
          confirmLabel="Delete bill"
          loading={remove.isPending}
          onConfirm={handleDelete}
          onClose={() => setConfirming(false)}
        />
      )}
    </header>
  );
}
