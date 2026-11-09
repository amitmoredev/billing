import { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import Modal, { ModalBody, ModalFooter } from '../ui/Modal.jsx';
import SelectField from '../ui/SelectField.jsx';
import Button from '../ui/Button.jsx';
import ErrorNote from '../ui/ErrorNote.jsx';
import { useBillMonths, useExportBills } from '../../queries/bill.query.js';
import { useSites } from '../../queries/site.query.js';
import { useToast } from '../../context/toast.context.js';
import { formatMonth, siteLabel } from '../../utils/format.js';

/**
 * Downloads verified bills as Excel, in the client's workbook layout (one
 * sheet per month). Pick a site — or all — and one month, a range, or every
 * month on record. `siteId` preselects a site.
 */
export default function ExportBillsModal({ siteId = '', onClose }) {
  const toast = useToast();
  const [site, setSite] = useState(siteId);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data: sites = [] } = useSites();
  const {
    data: months = [],
    isLoading: monthsLoading,
    isSuccess: monthsLoaded,
    error: monthsError,
  } = useBillMonths({ site: site || undefined });
  const exportBills = useExportBills();

  // Newest first reads better in a picker; the API sorts its own way.
  const monthOptions = [...months].reverse().map((month) => ({ value: month, label: formatMonth(month) }));
  const invalidRange = from && to && from > to;
  // Only an answer from the API means "nothing to export" — a failed request is not an empty one.
  const nothingToExport = monthsLoaded && !months.length;

  const handleExport = () =>
    exportBills.mutate(
      { site: site || undefined, from: from || undefined, to: to || undefined },
      {
        onSuccess: (fileName) => {
          toast.success('Excel downloaded', fileName);
          onClose();
        },
      }
    );

  return (
    <Modal
      title="Export to Excel"
      description="Verified bills, one sheet per month, in the Bill Analysis layout."
      onClose={onClose}
    >
      <ModalBody className="space-y-4">
        <SelectField
          label="Site"
          placeholder="All sites"
          options={sites.map((s) => ({ value: s.id, label: siteLabel(s) }))}
          value={site}
          onChange={(e) => {
            setSite(e.target.value);
            setFrom('');
            setTo('');
          }}
        />
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="From"
            placeholder="First month"
            options={monthOptions}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            disabled={!monthOptions.length}
          />
          <SelectField
            label="To"
            placeholder="Latest month"
            options={monthOptions}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            disabled={!monthOptions.length}
            error={invalidRange ? 'Before the start month' : undefined}
          />
        </div>
        <p className="text-xs text-subtle">
          Pick the same month in both for a single month. Leave both blank for every month on record.
        </p>

        {monthsError && (
          <ErrorNote message={`Couldn't load the months on record: ${monthsError.message}`} className="" />
        )}
        {nothingToExport && (
          <ErrorNote
            message={site ? 'No verified bills to export for this site yet.' : 'No verified bills to export yet.'}
            className=""
          />
        )}
        {exportBills.error && <ErrorNote message={exportBills.error.message} className="" />}
      </ModalBody>

      <ModalFooter>
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          icon={FileSpreadsheet}
          loading={exportBills.isPending}
          disabled={invalidRange || nothingToExport || monthsLoading}
          onClick={handleExport}
        >
          Download
        </Button>
      </ModalFooter>
    </Modal>
  );
}
