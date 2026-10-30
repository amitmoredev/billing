import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, LayoutGrid, TriangleAlert } from 'lucide-react';
import BillDetailHeader from '../components/bills/BillDetailHeader.jsx';
import BillViewer from '../components/bills/BillViewer.jsx';
import ParameterForm from '../components/bills/ParameterForm.jsx';
import Breadcrumbs from '../components/ui/Breadcrumbs.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { useBill } from '../queries/bill.query.js';
import { UNASSIGNED_SITE, useSitePaths } from '../hooks/useSitePaths.js';

export default function BillDetailPage() {
  const { siteId, billId } = useParams();
  const paths = useSitePaths();
  const { data: bill, isLoading, error } = useBill(billId);

  if (isLoading) {
    return (
      <div className="grid h-full place-items-center gap-3">
        <Spinner className="size-7" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-x w-full space-y-6 py-7">
        <Breadcrumbs
          items={[{ label: 'Sites & Bills', to: paths.sites, icon: LayoutGrid }, { label: 'Bill not found' }]}
        />
        <div className="card">
          <EmptyState
            icon={TriangleAlert}
            title="Could not load bill"
            description={error.message}
            action={
              <Link to={paths.sites}>
                <Button variant="secondary" icon={ArrowLeft}>
                  Back to all sites
                </Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  // The URL names a site; the bill knows its real one. When they differ — the
  // site was just changed in the form, or an old link — follow the bill.
  if ((bill.site?.id ?? UNASSIGNED_SITE) !== siteId) {
    return <Navigate to={paths.bill(bill)} replace />;
  }

  return (
    <div className="flex h-full flex-col">
      <BillDetailHeader bill={bill} />

      {/* Split view: document on the left, extraction form on the right. */}
      <div
        className="grid min-h-0 flex-1 gap-4 p-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(420px,1fr)]
          lg:gap-5 lg:p-5 2xl:grid-cols-[minmax(0,1.7fr)_minmax(520px,1fr)]"
      >
        <BillViewer file={bill.file} fileUrl={bill.fileUrl} />
        <div className="card min-h-0 overflow-hidden">
          <ParameterForm bill={bill} />
        </div>
      </div>
    </div>
  );
}

/** Old `/bills/:id` links: load the bill once, then send it to its home under its site. */
export function LegacyBillRedirect() {
  const { billId } = useParams();
  const paths = useSitePaths();
  const { data: bill, isLoading, error } = useBill(billId);

  if (isLoading) {
    return (
      <div className="grid h-full place-items-center">
        <Spinner className="size-7" />
      </div>
    );
  }

  return <Navigate to={error ? paths.sites : paths.bill(bill)} replace />;
}
