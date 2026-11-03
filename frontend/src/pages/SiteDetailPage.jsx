import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Inbox, LayoutGrid, ListChecks, Lock, MapPin, MapPinOff, Pencil, Trash2, Zap } from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs.jsx';
import Button from '../components/ui/Button.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Tooltip from '../components/ui/Tooltip.jsx';
import SiteFormModal from '../components/sites/SiteFormModal.jsx';
import UploadDropzone from '../components/bills/UploadDropzone.jsx';
import BillStats from '../components/bills/BillStats.jsx';
import BillFilters from '../components/bills/BillFilters.jsx';
import BillList from '../components/bills/BillList.jsx';
import { useBillStats, useInfiniteBills } from '../queries/bill.query.js';
import { useDeleteSite, useSites } from '../queries/site.query.js';
import { useSession } from '../queries/auth.query.js';
import { useBillUpload } from '../hooks/useBillUpload.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { UNASSIGNED_SITE, useSitePaths } from '../hooks/useSitePaths.js';
import { useToast } from '../context/toast.context.js';
import { NO_SITE } from '../constants/bill.constants.js';
import { ACTIONS, SUBJECTS } from '../constants/permission.constants.js';

/**
 * One site and everything filed under it: its details, its numbers, an upload
 * strip that files new bills here, and its bills. `/sites/unassigned` is the
 * same page for bills that have no site yet (minus the upload strip — new
 * bills always start inside a site).
 */
export default function SiteDetailPage() {
  const { siteId } = useParams();
  const isUnassigned = siteId === UNASSIGNED_SITE;
  const apiSite = isUnassigned ? NO_SITE : siteId;

  const navigate = useNavigate();
  const paths = useSitePaths();
  const toast = useToast();
  const { user, can } = useSession();

  const { data: sites = [], isLoading: sitesLoading, error: sitesError } = useSites();
  const site = isUnassigned ? null : sites.find((s) => s.id === siteId);

  const [filters, setFilters] = useState({ status: '', search: '' });
  const debouncedSearch = useDebouncedValue(filters.search, 350);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const { current, upload } = useBillUpload();
  const deleteSite = useDeleteSite();
  const { data: stats } = useBillStats({ site: apiSite });
  const { data, isLoading, error, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteBills({
    status: filters.status || undefined,
    site: apiSite,
    search: debouncedSearch || undefined,
  });
  // Batches can overlap if bills arrive between requests (the list is newest-first), so dedupe by id.
  const bills = useMemo(() => {
    const seen = new Set();
    return (data?.pages ?? [])
      .flatMap((page) => page.items)
      .filter((bill) => !seen.has(bill.id) && seen.add(bill.id));
  }, [data]);
  const total = data?.pages.at(-1)?.pagination.total ?? 0;

  const rootCrumb = { label: 'Sites & Bills', to: paths.sites, icon: LayoutGrid };

  if (!isUnassigned && sitesLoading) {
    return (
      <div className="grid h-full place-items-center">
        <Spinner className="size-7" />
      </div>
    );
  }

  if (!isUnassigned && !site) {
    return (
      <div className="page-x w-full space-y-6 py-7">
        <Breadcrumbs items={[rootCrumb, { label: 'Not found' }]} />
        <div className="card">
          <EmptyState
            icon={MapPinOff}
            title={sitesError ? 'Could not load this site' : 'Site not found'}
            description={sitesError?.message ?? 'It may have been deleted, or the link is wrong.'}
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

  const handleDelete = () => {
    deleteSite.mutate(site.id, {
      onSuccess: () => {
        toast.success('Site deleted', site.name);
        navigate(paths.sites, { replace: true });
      },
      onError: (err) => {
        setConfirmingDelete(false);
        toast.error('Could not delete site', err.message);
      },
    });
  };

  return (
    <div className="page-x w-full space-y-6 py-7">
      <Breadcrumbs items={[rootCrumb, { label: isUnassigned ? 'Unassigned bills' : site.name }]} />

      {isUnassigned ? (
        <UnassignedHeader assignTo={paths.assign} />
      ) : (
        <SiteHeader
          site={site}
          userId={user?.id}
          mayEdit={can(ACTIONS.UPDATE, SUBJECTS.SITE, site)}
          mayDelete={can(ACTIONS.DELETE, SUBJECTS.SITE, site)}
          onEdit={() => setEditing(true)}
          onDelete={() => setConfirmingDelete(true)}
        />
      )}

      <BillStats stats={stats} />

      {!isUnassigned && (
        <UploadDropzone onFiles={(files) => upload(files, site.id)} current={current} site={site} />
      )}

      <BillList
        bills={bills}
        total={total}
        hasMore={Boolean(hasNextPage)}
        loadingMore={isFetchingNextPage}
        onLoadMore={fetchNextPage}
        loading={isLoading}
        error={error}
        filtered={Boolean(filters.status || debouncedSearch)}
        billHref={paths.bill}
        emptyHint={
          isUnassigned
            ? 'Every bill is filed under a site.'
            : `Drop a PDF or photo of a bill above to add it to ${site.name}.`
        }
        toolbar={
          <BillFilters
            status={filters.status}
            search={filters.search}
            counts={stats}
            onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
          />
        }
      />

      {editing && <SiteFormModal site={site} onClose={() => setEditing(false)} />}

      {confirmingDelete && (
        <ConfirmDialog
          title="Delete site"
          message={
            <>
              <strong className="font-semibold text-ink">{site.name}</strong> will be removed. A site that
              still has bills can&apos;t be deleted.
            </>
          }
          confirmLabel="Delete site"
          loading={deleteSite.isPending}
          onConfirm={handleDelete}
          onClose={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}

/** "Added by you" / "Added by admin" / "Added by Priya"; empty when the creator isn't known. */
const creatorLabel = (creator, userId) => {
  if (!creator) return '';
  if (creator.id === userId) return 'Added by you';
  if (creator.isAdmin) return 'Added by admin';
  return creator.name ? `Added by ${creator.name}` : '';
};

function SiteHeader({ site, userId, mayEdit, mayDelete, onEdit, onDelete }) {
  const addedBy = creatorLabel(site.createdBy, userId);
  const details = [
    site.discom && { icon: Zap, text: site.discom },
    site.address && { icon: MapPin, text: site.address },
  ].filter(Boolean);

  return (
    <header className="card rise-in relative overflow-hidden p-5 sm:p-6">
      {/* Faint grid behind the site's name — the same texture the landing and sign-in pages use. */}
      <div aria-hidden className="bg-grid fade-edges pointer-events-none absolute inset-0 opacity-60" />

      <div className="relative flex flex-wrap items-start gap-4 sm:gap-5">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-accent text-on-accent shadow-card">
          <MapPin className="size-7" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="page-title truncate">{site.name}</h1>
            {site.code && (
              <span className="num rounded-lg bg-sunken px-2 py-0.5 text-sm font-semibold text-muted ring-1 ring-inset ring-line">
                {site.code}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted">
            {details.map(({ icon: IconComponent, text }) => (
              <span key={text} className="flex min-w-0 items-center gap-1.5">
                <IconComponent className="size-4 shrink-0 text-subtle" />
                <span className="truncate">{text}</span>
              </span>
            ))}
            {!details.length && <span className="text-subtle">No discom or address added yet</span>}
          </div>

          {addedBy && <p className="mt-2 text-xs text-subtle">{addedBy}</p>}
        </div>

        <div className="flex shrink-0 gap-2">
          {mayEdit && (
            <Button variant="secondary" size="sm" icon={Pencil} onClick={onEdit}>
              Edit
            </Button>
          )}
          {mayDelete && (
            <Button variant="danger" size="sm" icon={Trash2} onClick={onDelete} aria-label="Delete site">
              <span className="hidden sm:inline">Delete</span>
            </Button>
          )}
          {!mayEdit && !mayDelete && (
            <Tooltip label="Not allowed" align="end">
              <span
                tabIndex={0}
                className="focus-ring flex h-9 cursor-not-allowed items-center gap-1.5 rounded-lg bg-sunken px-3 text-sm
                  font-medium text-subtle ring-1 ring-inset ring-line"
              >
                <Lock className="size-3.5" />
                View only
              </span>
            </Tooltip>
          )}
        </div>
      </div>
    </header>
  );
}

function UnassignedHeader({ assignTo }) {
  return (
    <header className="card rise-in flex flex-wrap items-start gap-4 p-5 sm:gap-5 sm:p-6">
      <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-warn-soft text-warn-fg ring-1 ring-inset ring-warn-line">
        <Inbox className="size-7" />
      </span>
      <div className="min-w-0 flex-1">
        <h1 className="page-title">Unassigned bills</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">
          These bills aren&apos;t filed under a site yet. Open one and pick its site, or file many at once.
        </p>
      </div>
      <Link to={assignTo}>
        <Button icon={ListChecks}>Assign in bulk</Button>
      </Link>
    </header>
  );
}
