import { useParams } from 'react-router-dom';
import { TriangleAlert } from 'lucide-react';
import BillDetailHeader from '../components/bills/BillDetailHeader.jsx';
import BillViewer from '../components/bills/BillViewer.jsx';
import ParameterForm from '../components/bills/ParameterForm.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { useBill } from '../queries/bill.query.js';

export default function BillDetailPage() {
  const { id } = useParams();
  const { data: bill, isLoading, error } = useBill(id);

  if (isLoading) {
    return (
      <div className="grid h-full place-items-center gap-3">
        <Spinner className="size-7" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState icon={TriangleAlert} title="Could not load bill" description={error.message} />
    );
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
