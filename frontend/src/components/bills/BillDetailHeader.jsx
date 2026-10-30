import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, LayoutGrid, MapPin, Trash2 } from 'lucide-react';
import Breadcrumbs from '../ui/Breadcrumbs.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';
import Button from '../ui/Button.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { useDeleteBill } from '../../queries/bill.query.js';
import { useSitePaths } from '../../hooks/useSitePaths.js';
import { useToast } from '../../context/toast.context.js';

/** Trail back to the bill's site, the bill's name, and its status and delete action. */
export default function BillDetailHeader({ bill }) {
  const navigate = useNavigate();
  const paths = useSitePaths();
  const remove = useDeleteBill();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);

  const consumerName = bill.parameters?.consumerName;
  const sitePath = paths.site(bill.site?.id);

  const handleDelete = () => {
    remove.mutate(bill.id, {
      onSuccess: () => {
        toast.success('Bill deleted', bill.file.originalName);
        navigate(sitePath, { replace: true });
      },
      onError: (err) => {
        setConfirming(false);
        toast.error('Could not delete bill', err.message);
      },
    });
  };

  return (
    <header className="shrink-0 border-b border-line bg-surface px-4 py-3 lg:px-6">
      <Breadcrumbs
        className="-ml-1.5"
        items={[
          { label: 'Sites & Bills', to: paths.sites, icon: LayoutGrid },
          bill.site
            ? { label: bill.site.name, to: sitePath, icon: MapPin }
            : { label: 'Unassigned bills', to: sitePath, icon: Inbox },
          { label: bill.file.originalName },
        ]}
      />

      <div className="mt-1.5 flex items-center gap-3.5">
        <div className="min-w-0 flex-1 leading-tight">
          <h1 className="truncate font-display text-xl font-bold tracking-tight text-ink">
            {consumerName || bill.file.originalName}
          </h1>
          <p className="mt-0.5 truncate text-sm text-subtle">
            {[
              bill.site?.discom,
              consumerName ? bill.parameters?.customerNumber : 'Consumer details not filled in yet',
            ]
              .filter(Boolean)
              .join(' · ')}
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
      </div>

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
