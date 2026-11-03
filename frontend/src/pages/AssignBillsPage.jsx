import { useMemo, useState } from 'react';
import { Check, FileText, Image as ImageIcon, LayoutGrid, ListChecks, Minus, Plus, SearchX, TriangleAlert, X } from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import SearchInput from '../components/ui/SearchInput.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { Select } from '../components/ui/SelectField.jsx';
import SiteFormModal from '../components/sites/SiteFormModal.jsx';
import { LoadMore } from '../components/bills/BillList.jsx';
import { useAssignBillsToSite, useInfiniteBills } from '../queries/bill.query.js';
import { useSites, useUnassignedBills } from '../queries/site.query.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { useSitePaths } from '../hooks/useSitePaths.js';
import { useToast } from '../context/toast.context.js';
import { NO_SITE } from '../constants/bill.constants.js';
import { formatMonth, isPdf, siteLabel } from '../utils/format.js';

/*
 * TEMPORARY — for filing the bills that existed before sites did. Remove this
 * page, its routes in App.jsx and its menu entries once every bill has a site.
 */

// The API's largest page, so a typical backlog arrives in one or two requests.
const PAGE_SIZE = 100;

const VIEWS = [
  { value: 'unassigned', label: 'No site yet' },
  { value: 'all', label: 'All bills' },
];

const ROW_GRID =
  'grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 ' +
  '@3xl:grid-cols-[auto_minmax(0,2fr)_minmax(0,1fr)_96px_minmax(0,1.2fr)_130px]';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * Bulk filing: tick bills, pick a site, assign. Searching a customer number
 * gathers one connection's bills — usually one site's — so "select all" plus
 * one click files them together.
 */
export default function AssignBillsPage() {
  const paths = useSitePaths();
  const toast = useToast();

  const [view, setView] = useState('unassigned');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [selected, setSelected] = useState(() => new Set());
  const [targetSite, setTargetSite] = useState('');
  const [addingSite, setAddingSite] = useState(false);

  const { data: sites = [] } = useSites();
  const { data: unassigned } = useUnassignedBills();
  const assign = useAssignBillsToSite();
  const { data, isLoading, error, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteBills(
    { site: view === 'unassigned' ? NO_SITE : undefined, search: debouncedSearch || undefined },
    { pageSize: PAGE_SIZE }
  );

  const bills = useMemo(() => {
    const seen = new Set();
    return (data?.pages ?? [])
      .flatMap((page) => page.items)
      .filter((bill) => !seen.has(bill.id) && seen.add(bill.id));
  }, [data]);
  const total = data?.pages.at(-1)?.pagination.total ?? 0;

  const visibleSelected = bills.filter((bill) => selected.has(bill.id)).length;
  const allVisibleSelected = bills.length > 0 && visibleSelected === bills.length;
  const hiddenSelected = selected.size - visibleSelected;

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAllVisible = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const bill of bills) {
        if (allVisibleSelected) next.delete(bill.id);
        else next.add(bill.id);
      }
      return next;
    });

  const switchView = (next) => {
    setView(next);
    setSelected(new Set()); // a selection from the other list would be invisible here
  };

  const target = sites.find((site) => site.id === targetSite);

  const handleAssign = () => {
    const count = selected.size;
    assign.mutate(
      { billIds: [...selected], siteId: targetSite },
      {
        onSuccess: () => {
          toast.success(`${plural(count, 'bill')} assigned`, `Filed under ${siteLabel(target)}.`);
          setSelected(new Set()); // keep the site picked — the next batch often goes to the same one
        },
        onError: (err) => toast.error('Could not assign bills', err.message),
      }
    );
  };

  return (
    <div className="page-x w-full space-y-6 pb-32 pt-7">
      <Breadcrumbs
        items={[{ label: 'Sites & Bills', to: paths.sites, icon: LayoutGrid }, { label: 'Assign bills' }]}
      />

      <header className="flex flex-wrap items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent-fg ring-1 ring-inset ring-accent-line">
          <ListChecks className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="page-title">Assign bills to sites</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted">
            Tick the bills that belong together, pick their site at the bottom, and assign them in one go.
            Tip: search a customer number to gather one connection&apos;s bills, then select all.
          </p>
        </div>
        {unassigned && (
          <span className="rounded-full bg-warn-soft px-3 py-1.5 text-sm font-semibold text-warn-fg ring-1 ring-inset ring-warn-line">
            {unassigned.total ? `${plural(unassigned.total, 'bill')} without a site` : 'Every bill has a site'}
          </span>
        )}
      </header>

      <section className="card @container overflow-hidden">
        {/* Toolbar: which bills, and search. */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 lg:px-6">
          <div className="flex gap-1 rounded-xl border border-line bg-sunken p-1">
            {VIEWS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => switchView(option.value)}
                aria-pressed={view === option.value}
                className={`focus-ring rounded-lg px-3 py-1.5 text-sm font-semibold transition duration-200 ${
                  view === option.value
                    ? 'bg-surface text-accent-fg shadow-card ring-1 ring-line'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search customer number, consumer or file"
            className="w-full sm:w-auto sm:min-w-64 sm:max-w-md sm:flex-1"
          />
        </div>

        {/* Column header with the select-all box. */}
        <div className={`grid border-b border-line bg-sunken px-5 py-3 lg:px-6 ${ROW_GRID}`}>
          <Checkbox
            checked={allVisibleSelected}
            mixed={visibleSelected > 0 && !allVisibleSelected}
            disabled={!bills.length}
            onChange={toggleAllVisible}
            label={allVisibleSelected ? 'Deselect all shown bills' : 'Select all shown bills'}
          />
          <span className="label-caps">
            {bills.length ? `${plural(bills.length, 'bill')} shown` : 'Bill'}
          </span>
          <span className="label-caps hidden @3xl:block">Consumer no.</span>
          <span className="label-caps hidden @3xl:block">Month</span>
          <span className="label-caps hidden @3xl:block">Current site</span>
          <span className="label-caps hidden @3xl:block">Status</span>
        </div>

        <Rows
          bills={bills}
          loading={isLoading}
          error={error}
          searching={Boolean(debouncedSearch)}
          view={view}
          selected={selected}
          onToggle={toggle}
        />

        {!isLoading && !error && bills.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-sunken px-5 py-3 lg:px-6">
            <p className="text-sm text-muted">
              Showing <span className="font-semibold text-ink">{bills.length}</span> of{' '}
              <span className="font-semibold text-ink">{total}</span>
            </p>
            <LoadMore hasMore={Boolean(hasNextPage)} loading={isFetchingNextPage} onLoadMore={fetchNextPage} />
          </div>
        )}
      </section>

      {/* Sticky action bar — only while something is ticked. */}
      {selected.size > 0 && (
        <div className="sticky bottom-5 z-30 rise-in">
          <div
            className="mx-auto flex max-w-4xl flex-wrap items-center gap-3 rounded-2xl border border-line bg-elevated/95
              p-3 pl-5 shadow-float backdrop-blur"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="num grid h-7 min-w-7 place-items-center rounded-lg bg-accent px-2 text-sm font-semibold text-on-accent">
                {selected.size}
              </span>
              <span className="text-sm font-semibold text-ink">selected</span>
              {hiddenSelected > 0 && (
                <span className="text-xs text-subtle">({hiddenSelected} not in this search)</span>
              )}
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="focus-ring ml-1 inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-semibold
                  text-muted transition hover:bg-hover hover:text-ink"
              >
                <X className="size-3.5" />
                Clear
              </button>
            </div>

            <div className="ml-auto flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <Select
                aria-label="Site to assign the selected bills to"
                value={targetSite}
                onChange={(e) => setTargetSite(e.target.value)}
                placeholder={sites.length ? 'Choose a site…' : 'No sites yet'}
                options={sites.map((site) => ({ value: site.id, label: siteLabel(site) }))}
                className="min-w-0 flex-1 sm:w-64 sm:flex-none"
              />
              <Button variant="secondary" icon={Plus} onClick={() => setAddingSite(true)} aria-label="New site">
                <span className="hidden sm:inline">New site</span>
              </Button>
              <Button icon={Check} loading={assign.isPending} disabled={!targetSite} onClick={handleAssign}>
                Assign {selected.size}
              </Button>
            </div>
          </div>
        </div>
      )}

      {addingSite && (
        <SiteFormModal onClose={() => setAddingSite(false)} onSaved={(site) => setTargetSite(site.id)} />
      )}
    </div>
  );
}

function Rows({ bills, loading, error, searching, view, selected, onToggle }) {
  if (loading) {
    return (
      <div className="grid place-items-center gap-3 py-20">
        <Spinner className="size-7" />
        <p className="text-sm font-medium text-subtle">Loading bills…</p>
      </div>
    );
  }

  if (error) {
    return <EmptyState icon={TriangleAlert} title="Could not load bills" description={error.message} />;
  }

  if (!bills.length) {
    if (searching) {
      return <EmptyState icon={SearchX} title="No matching bills" description="Try another search." />;
    }
    return view === 'unassigned' ? (
      <EmptyState
        icon={Check}
        title="All done"
        description="Every bill is filed under a site. This screen can be removed."
      />
    ) : (
      <EmptyState icon={FileText} title="No bills yet" description="Upload bills inside a site." />
    );
  }

  return (
    <div className="divide-y divide-line">
      {bills.map((bill) => (
        <Row key={bill.id} bill={bill} checked={selected.has(bill.id)} onToggle={() => onToggle(bill.id)} />
      ))}
    </div>
  );
}

function Row({ bill, checked, onToggle }) {
  const { parameters = {}, file } = bill;
  const FileIcon = isPdf(file.mimeType) ? FileText : ImageIcon;
  const site = siteLabel(bill.site);

  return (
    // The whole row toggles; the checkbox inside shows the state.
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault();
          onToggle();
        }
      }}
      className={`focus-ring grid cursor-pointer select-none px-5 py-3 transition lg:px-6 ${ROW_GRID}
        ${checked ? 'bg-accent-soft/60 hover:bg-accent-soft' : 'hover:bg-hover'}`}
    >
      <CheckboxMark checked={checked} />

      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sunken text-muted ring-1 ring-inset ring-line">
          <FileIcon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{parameters.consumerName || file.originalName}</p>
          <p className="mt-0.5 truncate text-xs text-subtle">
            {/* Narrow tables drop the other columns, so the key ones ride along here. */}
            <span className="@3xl:hidden">
              {[parameters.customerNumber, formatMonth(parameters.billMonth), site || 'No site'].join(' · ')} ·{' '}
            </span>
            {parameters.consumerName ? file.originalName : 'Details not filled in yet'}
          </p>
        </div>
      </div>

      <p className="num hidden truncate text-sm text-muted @3xl:block">{parameters.customerNumber || '—'}</p>
      <p className="hidden whitespace-nowrap text-sm text-muted @3xl:block">{formatMonth(parameters.billMonth)}</p>
      <p className={`hidden truncate text-sm @3xl:block ${site ? 'text-ink' : 'text-subtle'}`} title={site}>
        {site || 'No site yet'}
      </p>
      <div className="flex justify-end @3xl:justify-start">
        <StatusBadge status={bill.status} />
      </div>
    </div>
  );
}

/** The header's select-all box: a real button, with a "some selected" dash. */
function Checkbox({ checked, mixed, disabled, onChange, label }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={mixed ? 'mixed' : checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onChange}
      className="focus-ring rounded-md disabled:opacity-40"
    >
      <CheckboxMark checked={checked} mixed={mixed} />
    </button>
  );
}

function CheckboxMark({ checked, mixed = false }) {
  const on = checked || mixed;
  return (
    <span
      aria-hidden
      className={`grid size-5 place-items-center rounded-md ring-1 ring-inset transition duration-150 ${
        on ? 'bg-accent text-on-accent ring-accent' : 'bg-surface ring-line-strong'
      }`}
    >
      {mixed ? <Minus className="size-3.5" strokeWidth={3} /> : checked && <Check className="size-3.5" strokeWidth={3} />}
    </span>
  );
}
