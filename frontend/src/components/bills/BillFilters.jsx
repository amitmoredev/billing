import SearchInput from '../ui/SearchInput.jsx';
import { BILL_STATUS, STATUS_LABELS } from '../../constants/bill.constants.js';

// `countKey` points into the stats response, so each tab shows how many it holds.
const TABS = [
  { value: '', label: 'All', countKey: 'total' },
  { value: BILL_STATUS.UPLOADED, label: STATUS_LABELS[BILL_STATUS.UPLOADED], countKey: 'uploaded' },
  { value: BILL_STATUS.SUBMITTED, label: STATUS_LABELS[BILL_STATUS.SUBMITTED], countKey: 'submitted' },
];

/** Status tabs and search — the table's own toolbar. */
export default function BillFilters({ status, search, counts, onChange }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Scrolls sideways on a narrow phone instead of wrapping a label onto two lines. */}
      <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-line bg-sunken p-1">
        {TABS.map((tab) => {
          const active = status === tab.value;

          return (
            <button
              key={tab.value || 'all'}
              type="button"
              onClick={() => onChange({ status: tab.value })}
              aria-pressed={active}
              className={`focus-ring flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                active ? 'bg-accent text-on-accent shadow-card' : 'text-muted hover:text-ink'
              }`}
            >
              {tab.label}
              {counts && (
                <span
                  className={`num rounded-md px-1.5 text-xs ${
                    active ? 'bg-on-accent/15' : 'bg-surface ring-1 ring-inset ring-line'
                  }`}
                >
                  {counts[tab.countKey] ?? 0}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <SearchInput
        value={search}
        onChange={(value) => onChange({ search: value })}
        placeholder="Search consumer, number or file"
        className="w-full sm:w-auto sm:min-w-56 sm:max-w-sm sm:flex-1"
      />
    </div>
  );
}
