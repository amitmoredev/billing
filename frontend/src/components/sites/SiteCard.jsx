import { Link } from 'react-router-dom';
import { ArrowRight, Inbox, Lock, MapPin, Pencil, Trash2, Zap } from 'lucide-react';
import Tooltip from '../ui/Tooltip.jsx';

/** Cards past this index skip the entrance animation — a long grid shouldn't ripple. */
const ANIMATED_CARDS = 12;

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** "Added by you" / "Added by admin" / "Added by Priya"; empty when the creator isn't known. */
const creatorLabel = (creator, userId) => {
  if (!creator) return '';
  if (creator.id === userId) return 'Added by you';
  if (creator.isAdmin) return 'Added by admin';
  return creator.name ? `Added by ${creator.name}` : '';
};

/**
 * One site in the grid. The whole card opens the site (a stretched link);
 * edit and delete sit above that link so they stay their own buttons.
 */
export default function SiteCard({ site, to, userId, mayEdit, mayDelete, onEdit, onDelete, index = 0 }) {
  const { total, pending, verified, consumers = 0 } = site.bills;
  const addedBy = creatorLabel(site.createdBy, userId);

  return (
    <article
      style={index < ANIMATED_CARDS ? { animationDelay: `${index * 40}ms` } : undefined}
      className={`card group relative flex flex-col p-5 transition duration-200 hover:-translate-y-0.5
        hover:border-line-strong hover:shadow-raised ${index < ANIMATED_CARDS ? 'rise-in' : ''}`}
    >
      <Link to={to} aria-label={`Open ${site.name}`} className="focus-ring absolute inset-0 z-0 rounded-card" />

      <div className="flex items-start gap-3.5">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-fg ring-1 ring-inset
            ring-accent-line transition group-hover:scale-105"
        >
          <MapPin className="size-5" />
        </span>

        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className="truncate text-base font-semibold text-ink" title={site.name}>
            {site.name}
          </h2>
          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-subtle">
            {site.code && (
              <span className="num shrink-0 rounded-md bg-sunken px-1.5 py-0.5 font-semibold text-muted ring-1 ring-inset ring-line">
                {site.code}
              </span>
            )}
            {site.discom && (
              <span className="flex min-w-0 items-center gap-1">
                <Zap className="size-3.5 shrink-0" />
                <span className="truncate">{site.discom}</span>
              </span>
            )}
          </p>
          {[site.organisation, site.state, site.consumerCategory].some(Boolean) && (
            <p className="mt-1 truncate text-xs text-subtle">
              {[site.organisation, site.state, site.consumerCategory].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        {/* Above the stretched link, so these get their own clicks. */}
        <div className="relative z-10 -mr-2 -mt-2 flex shrink-0 gap-0.5">
          {mayEdit && <CardAction icon={Pencil} label={`Edit ${site.name}`} onClick={() => onEdit(site)} />}
          {mayDelete && (
            <CardAction icon={Trash2} label={`Delete ${site.name}`} danger onClick={() => onDelete(site)} />
          )}
          {!mayEdit && !mayDelete && (
            <Tooltip label="Not allowed" align="end">
              <span
                tabIndex={0}
                aria-label="Not allowed"
                className="focus-ring grid size-8 cursor-not-allowed place-items-center rounded-lg text-subtle/70
                  transition hover:bg-hover hover:text-muted"
              >
                <Lock className="size-3.5" />
              </span>
            </Tooltip>
          )}
        </div>
      </div>

      <p className="mt-3 line-clamp-1 min-h-5 text-sm text-muted" title={site.address}>
        {site.address || <span className="text-subtle">No address added</span>}
      </p>

      <BillCounts total={total} pending={pending} verified={verified} consumers={consumers} />

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3.5 text-xs">
        <span className="truncate text-subtle">{addedBy}</span>
        <span className="flex shrink-0 items-center gap-1 font-semibold text-muted transition group-hover:text-ink">
          Open
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </article>
  );
}

/** Bills not filed under any site yet — a dashed card that leads to them. */
export function UnassignedCard({ counts, to }) {
  return (
    <Link
      to={to}
      className="focus-ring group flex flex-col justify-between gap-5 rounded-card border border-dashed
        border-warn-line bg-warn-soft/40 p-5 transition duration-200 hover:-translate-y-0.5 hover:bg-warn-soft/70
        hover:shadow-raised"
    >
      <div className="flex items-start gap-3.5">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-warn-soft text-warn-fg ring-1 ring-inset ring-warn-line">
          <Inbox className="size-5" />
        </span>
        <div className="min-w-0 pt-0.5">
          <h2 className="text-base font-semibold text-ink">Unassigned bills</h2>
          <p className="mt-0.5 text-sm text-muted">
            {plural(counts.total, 'bill')} not filed under a site yet. Open one to pick its site.
          </p>
        </div>
      </div>

      <span className="flex items-center gap-1 self-end text-xs font-semibold text-warn-fg">
        Sort them out
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

/**
 * Four small figures — bills, consumer numbers (one per electricity
 * connection), pending, verified — plus a bar of how much is verified.
 */
function BillCounts({ total, pending, verified, consumers }) {
  const share = total ? Math.round((verified / total) * 100) : 0;

  return (
    <div className="mt-4">
      <dl className="grid grid-cols-2 gap-2">
        <Count label="Bills" value={total} />
        <Count label="Consumer nos." value={consumers} />
        <Count label="Pending" value={pending} tone={pending ? 'text-warn-fg' : 'text-ink'} />
        <Count label="Verified" value={verified} tone={verified ? 'text-ok-fg' : 'text-ink'} />
      </dl>

      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-sunken ring-1 ring-inset ring-line"
        role="progressbar"
        aria-label="Bills verified"
        aria-valuenow={share}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-ok-fg transition-[width] duration-500" style={{ width: `${share}%` }} />
      </div>
    </div>
  );
}

function Count({ label, value, tone = 'text-ink' }) {
  return (
    <div className="rounded-lg bg-sunken px-3 py-2 ring-1 ring-inset ring-line">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-subtle">{label}</dt>
      <dd className={`num mt-0.5 text-lg font-semibold leading-tight ${tone}`}>{value}</dd>
    </div>
  );
}

function CardAction({ icon: IconComponent, label, danger = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`focus-ring grid size-8 place-items-center rounded-lg text-subtle opacity-70 transition
        hover:bg-hover hover:opacity-100 group-hover:opacity-100 focus-visible:opacity-100
        ${danger ? 'hover:text-danger-fg' : 'hover:text-ink'}`}
    >
      <IconComponent className="size-4" />
    </button>
  );
}
