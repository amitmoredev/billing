import { useState } from 'react';
import UploadDropzone from '../components/bills/UploadDropzone.jsx';
import BillStats from '../components/bills/BillStats.jsx';
import BillFilters from '../components/bills/BillFilters.jsx';
import BillList from '../components/bills/BillList.jsx';
import { useBills, useBillStats } from '../queries/bill.query.js';
import { useBillUpload } from '../hooks/useBillUpload.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';

export default function BillsPage() {
  const [filters, setFilters] = useState({ status: '', search: '' });
  const debouncedSearch = useDebouncedValue(filters.search, 350);

  const { current, upload } = useBillUpload();
  const { data: stats } = useBillStats();
  const { data, isLoading, error } = useBills({
    status: filters.status || undefined,
    search: debouncedSearch || undefined,
  });

  return (
    <div className="page-x w-full space-y-6 py-7">
      {/* The sidebar already names the page; this keeps it in the document outline. */}
      <h1 className="sr-only">Sites and Bills</h1>

      <BillStats stats={stats} />

      <UploadDropzone onFiles={upload} current={current} />

      <BillList
        bills={data?.items ?? []}
        total={data?.pagination?.total ?? 0}
        loading={isLoading}
        error={error}
        filtered={Boolean(filters.status || debouncedSearch)}
        toolbar={
          <BillFilters
            status={filters.status}
            search={filters.search}
            counts={stats}
            onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
          />
        }
      />
    </div>
  );
}
