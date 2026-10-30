import { useMemo, useState } from 'react';
import { MapPin, MapPinPlus, SearchX, TriangleAlert } from 'lucide-react';
import SiteCard, { UnassignedCard } from '../components/sites/SiteCard.jsx';
import SiteFormModal from '../components/sites/SiteFormModal.jsx';
import BillStats from '../components/bills/BillStats.jsx';
import Button from '../components/ui/Button.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import SearchInput from '../components/ui/SearchInput.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { useDeleteSite, useSites, useUnassignedBills } from '../queries/site.query.js';
import { useBillStats } from '../queries/bill.query.js';
import { useSession } from '../queries/auth.query.js';
import { useSitePaths } from '../hooks/useSitePaths.js';
import { useToast } from '../context/toast.context.js';
import { ACTIONS, SUBJECTS } from '../constants/permission.constants.js';

/** Top of the Sites & Bills area: every site as a card; open one to see its bills. */
export default function SitesPage() {
  const toast = useToast();
  const paths = useSitePaths();
  const { user, can } = useSession();

  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState(null); // { site } while the form is open; site is null when adding
  const [pendingDelete, setPendingDelete] = useState(null);

  const { data: sites = [], isLoading, error } = useSites();
  const { data: unassigned } = useUnassignedBills();
  const { data: stats } = useBillStats();
  const deleteSite = useDeleteSite();

  // Every site is already loaded, so search runs here instead of on the API.
  const query = search.trim().toLowerCase();
  const visible = useMemo(
    () =>
      query
        ? sites.filter((site) =>
            [site.name, site.code, site.discom, site.address].some((value) =>
              value?.toLowerCase().includes(query)
            )
          )
        : sites,
    [sites, query]
  );

  const confirmDelete = () => {
    const site = pendingDelete;
    deleteSite.mutate(site.id, {
      onSuccess: () => {
        toast.success('Site deleted', site.name);
        setPendingDelete(null);
      },
      // e.g. bills still filed under it — the API says how many.
      onError: (err) => {
        setPendingDelete(null);
        toast.error('Could not delete site', err.message);
      },
    });
  };

  const openAdd = () => setEditor({ site: null });

  return (
    <div className="page-x w-full space-y-6 py-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="page-title">Sites &amp; Bills</h1>
          <p className="mt-1.5 text-sm text-muted">
            Every site you track. Open one to upload and review its bills.
          </p>
        </div>
        <Button icon={MapPinPlus} onClick={openAdd}>
          Add site
        </Button>
      </header>

      <BillStats stats={stats} />

      {sites.length > 0 && (
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search sites by name, code, discom or address"
          className="w-full sm:max-w-md"
        />
      )}

      <Grid
        sites={visible}
        loading={isLoading}
        error={error}
        searching={Boolean(query)}
        unassigned={!query && unassigned?.total ? unassigned : null}
        unassignedTo={paths.site(null)}
        onAdd={openAdd}
        renderSite={(site, index) => (
          <SiteCard
            key={site.id}
            site={site}
            index={index}
            to={paths.site(site.id)}
            userId={user?.id}
            mayEdit={can(ACTIONS.UPDATE, SUBJECTS.SITE, site)}
            mayDelete={can(ACTIONS.DELETE, SUBJECTS.SITE, site)}
            onEdit={(s) => setEditor({ site: s })}
            onDelete={setPendingDelete}
          />
        )}
      />

      {editor && <SiteFormModal site={editor.site} onClose={() => setEditor(null)} />}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete site"
          message={
            <>
              <strong className="font-semibold text-ink">{pendingDelete.name}</strong> will be removed.
              A site that still has bills can&apos;t be deleted.
            </>
          }
          confirmLabel="Delete site"
          loading={deleteSite.isPending}
          onConfirm={confirmDelete}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}

function Grid({ sites, loading, error, searching, unassigned, unassignedTo, renderSite, onAdd }) {
  if (loading) {
    return (
      <div className="card grid place-items-center gap-3 py-24">
        <Spinner className="size-7" />
        <p className="text-sm font-medium text-subtle">Loading sites…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <EmptyState icon={TriangleAlert} title="Could not load sites" description={error.message} />
      </div>
    );
  }

  if (!sites.length && !unassigned) {
    return (
      <div className="card">
        {searching ? (
          <EmptyState
            icon={SearchX}
            title="No matching sites"
            description="Try a different name, code, discom or address."
          />
        ) : (
          <EmptyState
            icon={MapPin}
            title="No sites yet"
            description="Add the plants, offices or stores whose bills you track. Each site keeps its own bills."
            action={
              <Button icon={MapPinPlus} onClick={onAdd}>
                Add your first site
              </Button>
            }
          />
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 min-[1800px]:grid-cols-4">
      {unassigned && <UnassignedCard counts={unassigned} to={unassignedTo} />}
      {sites.map(renderSite)}
    </div>
  );
}
