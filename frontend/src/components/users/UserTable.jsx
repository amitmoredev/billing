import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  TriangleAlert,
  UserPlus,
  UserRound,
  Users,
} from 'lucide-react';
import Button from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Spinner from '../ui/Spinner.jsx';
import { displayName, formatDate, formatPhone } from '../../utils/format.js';

/**
 * Column template shared by the header and every row, so they stay aligned.
 * Below the `@3xl` container width a row collapses to user + actions.
 */
const ROW_GRID =
  'grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 @3xl:grid-cols-[minmax(0,2fr)_170px_130px_110px_80px]';

const COLUMNS = ['User', 'Mobile', 'Last sign-in', 'Access'];

/** The users table — laid out like the bills table, toolbar on top and count below. */
export default function UserTable({
  users,
  pagination,
  loading,
  error,
  searching,
  toolbar,
  onAdd,
  onEdit,
  onDelete,
  onPageChange,
}) {
  const showFooter = !loading && !error && users.length > 0 && pagination;

  return (
    <section className="card @container overflow-hidden">
      {toolbar && <div className="border-b border-line px-5 py-4 lg:px-6">{toolbar}</div>}

      <div className={`hidden border-b border-line bg-sunken px-5 py-3 @3xl:grid lg:px-6 ${ROW_GRID}`}>
        {COLUMNS.map((column) => (
          <span key={column} className="label-caps whitespace-nowrap">
            {column}
          </span>
        ))}
        <span />
      </div>

      <Body
        users={users}
        loading={loading}
        error={error}
        searching={searching}
        onAdd={onAdd}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      {showFooter && <Footer shown={users.length} pagination={pagination} onPageChange={onPageChange} />}
    </section>
  );
}

function Body({ users, loading, error, searching, onAdd, onEdit, onDelete }) {
  if (loading) {
    return (
      <div className="grid place-items-center gap-3 py-24">
        <Spinner className="size-7" />
        <p className="text-sm font-medium text-subtle">Loading users…</p>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState icon={TriangleAlert} title="Could not load users" description={error.message} />
    );
  }

  if (!users.length) {
    return searching ? (
      <EmptyState
        icon={Users}
        title="No matching users"
        description="Try a different name, number or email."
      />
    ) : (
      <EmptyState
        icon={Users}
        title="No users yet"
        description="Add a mobile number to let someone sign in."
        action={
          <Button icon={UserPlus} onClick={onAdd}>
            Add user
          </Button>
        }
      />
    );
  }

  return (
    <div className="divide-y divide-line">
      {users.map((user) => (
        <UserRow key={user.id} user={user} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}

function UserRow({ user, onEdit, onDelete }) {
  const name = displayName(user);

  return (
    <div className={`grid px-5 py-3.5 transition hover:bg-hover lg:px-6 ${ROW_GRID}`}>
      <div className="flex min-w-0 items-center gap-3.5">
        <span
          className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-bold
            text-ink ring-1 ring-inset ring-accent-line"
        >
          {user.name ? user.name.trim().charAt(0).toUpperCase() : <UserRound className="size-4.5" />}
        </span>

        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <span className="truncate">{name}</span>
            {/* Narrow tables drop the Access column, so flag blocked users inline. */}
            {!user.isActive && <AccessBadge active={false} className="@3xl:hidden" />}
          </p>
          <p className="mt-0.5 truncate text-xs text-subtle">
            <span className="num @3xl:hidden">{formatPhone(user.phone)}</span>
            {user.email && <span className="@3xl:hidden"> · </span>}
            {user.email}
          </p>
        </div>
      </div>

      <p className="num hidden whitespace-nowrap text-sm text-muted @3xl:block">{formatPhone(user.phone)}</p>

      <p className="hidden whitespace-nowrap text-sm text-muted @3xl:block">
        {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
      </p>

      <div className="hidden @3xl:block">
        <AccessBadge active={user.isActive} />
      </div>

      <div className="flex justify-end gap-1">
        <RowAction icon={Pencil} label={`Edit ${name}`} onClick={() => onEdit(user)} />
        <RowAction icon={Trash2} label={`Delete ${name}`} danger onClick={() => onDelete(user)} />
      </div>
    </div>
  );
}

function RowAction({ icon: IconComponent, label, danger = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`focus-ring grid size-9 place-items-center rounded-xl text-subtle transition hover:bg-hover
        ${danger ? 'hover:text-danger-fg' : 'hover:text-ink'}`}
    >
      <IconComponent className="size-4.5" />
    </button>
  );
}

function AccessBadge({ active, className = '' }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold
        tracking-wide ring-1 ring-inset ${className}
        ${active ? 'bg-ok-soft text-ok-fg ring-ok-line' : 'bg-danger-soft text-danger-fg ring-danger-line'}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {active ? 'Active' : 'Disabled'}
    </span>
  );
}

/** Count on the left; page controls on the right only when there is more than one page. */
function Footer({ shown, pagination, onPageChange }) {
  const { page, pages, total } = pagination;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-sunken px-5 py-3 lg:px-6">
      <p className="text-sm text-muted">
        Showing <span className="font-semibold text-ink">{shown}</span> of{' '}
        <span className="font-semibold text-ink">{total}</span> {total === 1 ? 'user' : 'users'}
        {pages > 1 && (
          <span className="hidden sm:inline">
            {' '}
            · page {page} of {pages}
          </span>
        )}
      </p>

      {pages > 1 && (
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={ChevronLeft}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
      )}
    </div>
  );
}
