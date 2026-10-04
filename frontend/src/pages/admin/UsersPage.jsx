import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import UserTable from '../../components/users/UserTable.jsx';
import UserFormModal from '../../components/users/UserFormModal.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import SearchInput from '../../components/ui/SearchInput.jsx';
import { useDeleteUser, useUsers } from '../../queries/user.query.js';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { useToast } from '../../context/toast.context.js';
import { displayName } from '../../utils/format.js';

export default function UsersPage() {
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState(null); // { user } while the form is open; user is null when adding
  const [pendingDelete, setPendingDelete] = useState(null);

  const debouncedSearch = useDebouncedValue(search, 350);
  const { data, isLoading, error } = useUsers({ search: debouncedSearch || undefined, page });
  const deleteUser = useDeleteUser();

  const users = data?.items ?? [];

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const confirmDelete = () => {
    const user = pendingDelete;
    deleteUser.mutate(user.id, {
      onSuccess: () => {
        toast.success('User deleted', `${displayName(user)} can no longer sign in.`);
        setPendingDelete(null);
        // Removing the only row on a later page would otherwise leave it empty.
        if (users.length === 1 && page > 1) setPage(page - 1);
      },
      onError: (err) => toast.error('Could not delete user', err.message),
    });
  };

  return (
    <div className="page-x w-full py-7">
      {/* The sidebar already names the page; this keeps it in the document outline. */}
      <h1 className="sr-only">User management</h1>

      <UserTable
        users={users}
        pagination={data?.pagination}
        loading={isLoading}
        error={error}
        searching={Boolean(debouncedSearch)}
        onAdd={() => setEditor({ user: null })}
        onEdit={(user) => setEditor({ user })}
        onDelete={setPendingDelete}
        onPageChange={setPage}
        toolbar={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SearchInput
              value={search}
              onChange={handleSearch}
              placeholder="Search name, number or email"
              className="w-full sm:w-auto sm:min-w-56 sm:max-w-sm sm:flex-1"
            />
            <Button icon={UserPlus} onClick={() => setEditor({ user: null })}>
              Add user
            </Button>
          </div>
        }
      />

      {editor && <UserFormModal user={editor.user} onClose={() => setEditor(null)} />}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete user"
          message={
            <>
              <strong className="font-semibold text-ink">{displayName(pendingDelete)}</strong> will
              be signed out and can no longer sign in. This cannot be undone.
            </>
          }
          confirmLabel="Delete user"
          loading={deleteUser.isPending}
          onConfirm={confirmDelete}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
