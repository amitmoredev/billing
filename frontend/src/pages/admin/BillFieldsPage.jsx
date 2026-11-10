import { useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  FolderPlus,
  ListPlus,
  Pencil,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import FieldFormModal from '../../components/bill-fields/FieldFormModal.jsx';
import GroupFormModal from '../../components/bill-fields/GroupFormModal.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import {
  useBillFields,
  useDeleteField,
  useDeleteGroup,
  useMoveField,
  useMoveGroup,
  useUpdateField,
} from '../../queries/bill-field.query.js';
import { FIELD_TYPE_OPTIONS } from '../../constants/bill.constants.js';
import { useToast } from '../../context/toast.context.js';
import { discomScope } from '../../utils/bill-fields.js';

const TYPE_LABELS = Object.fromEntries(FIELD_TYPE_OPTIONS.map((option) => [option.value, option.label]));

function Badge({ tone = 'neutral', children }) {
  const tones = {
    neutral: 'bg-sunken text-muted ring-line',
    accent: 'bg-accent-soft text-accent-fg ring-accent-line',
    warn: 'bg-warn-soft text-warn-fg ring-warn-line',
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function IconButton({ icon, label, ...props }) {
  return <Button variant="ghost" size="sm" icon={icon} aria-label={label} title={label} className="px-2" {...props} />;
}

/**
 * Admin: the bill parameter form — its sections and the fields in them, each
 * field limited to some DISCOMs or shown for all. Built-in fields drive the
 * analysis, so they can be relabelled and moved but not removed.
 */
export default function BillFieldsPage() {
  const toast = useToast();
  const { data, isLoading, error } = useBillFields();
  const moveField = useMoveField();
  const moveGroup = useMoveGroup();
  const updateField = useUpdateField();
  const deleteField = useDeleteField();
  const deleteGroup = useDeleteGroup();

  const [fieldEditor, setFieldEditor] = useState(null); // { field, defaults }
  const [groupEditor, setGroupEditor] = useState(null); // { group }
  const [pendingDelete, setPendingDelete] = useState(null); // { kind: 'field' | 'group', item }

  const fail = (title) => (err) => toast.error(title, err.message);
  const move = (mutation, item, direction) =>
    mutation.mutate({ id: item.id, direction }, { onError: fail('Could not move it') });

  const setArchived = (field, archived) =>
    updateField.mutate(
      { id: field.id, archived },
      {
        onSuccess: () =>
          toast.success(archived ? 'Parameter archived' : 'Parameter restored', field.label),
        onError: fail(archived ? 'Could not archive' : 'Could not restore'),
      }
    );

  const confirmDelete = () => {
    const { kind, item } = pendingDelete;
    (kind === 'field' ? deleteField : deleteGroup).mutate(item.id, {
      onSuccess: () => {
        toast.success(kind === 'field' ? 'Parameter deleted' : 'Section deleted', item.label ?? item.title);
        setPendingDelete(null);
      },
      onError: (err) => {
        toast.error('Could not delete', err.message);
        setPendingDelete(null);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="grid h-full place-items-center">
        <Spinner className="size-7" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-x w-full py-7">
        <div className="card">
          <EmptyState icon={TriangleAlert} title="Could not load parameters" description={error.message} />
        </div>
      </div>
    );
  }

  const { groups, fields } = data;

  return (
    <div className="page-x w-full space-y-6 py-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="page-title">Bill parameters</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted">
            The fields on every bill’s form. Limit a field to some DISCOMs and it shows only on their bills.
            Archiving hides a field but keeps the values bills already have.
          </p>
        </div>
        <div className="flex gap-2.5">
          <Button variant="secondary" icon={FolderPlus} onClick={() => setGroupEditor({ group: null })}>
            Add section
          </Button>
          <Button icon={ListPlus} onClick={() => setFieldEditor({ field: null, defaults: {} })} disabled={!groups.length}>
            Add parameter
          </Button>
        </div>
      </header>

      {groups.map((group, groupIndex) => {
        const own = fields.filter((field) => field.group === group.key);
        return (
          <section key={group.id} className="card @container overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-sunken px-5 py-3 lg:px-6">
              <h2 className="font-display text-base font-bold tracking-tight text-ink">
                {group.title}
                <span className="ml-2 text-sm font-medium text-subtle">{own.length}</span>
              </h2>
              <div className="flex items-center gap-0.5">
                <IconButton
                  icon={ListPlus}
                  label={`Add a parameter to ${group.title}`}
                  onClick={() => setFieldEditor({ field: null, defaults: { group: group.key } })}
                />
                <IconButton icon={ArrowUp} label="Move section up" disabled={groupIndex === 0} onClick={() => move(moveGroup, group, 'up')} />
                <IconButton
                  icon={ArrowDown}
                  label="Move section down"
                  disabled={groupIndex === groups.length - 1}
                  onClick={() => move(moveGroup, group, 'down')}
                />
                <IconButton icon={Pencil} label="Rename section" onClick={() => setGroupEditor({ group })} />
                <IconButton
                  icon={Trash2}
                  label={own.length ? 'Move its fields out to delete this section' : 'Delete section'}
                  disabled={own.length > 0}
                  onClick={() => setPendingDelete({ kind: 'group', item: group })}
                />
              </div>
            </div>

            {own.length ? (
              <ul className="divide-y divide-line">
                {own.map((field, index) => (
                  <li
                    key={field.id}
                    className={`flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3.5 lg:px-6
                      ${field.archived ? 'opacity-60' : ''}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-semibold text-ink">{field.label}</span>
                        {field.required && <Badge tone="accent">Required</Badge>}
                        {field.archived && <Badge tone="warn">Archived</Badge>}
                        {!field.system && !field.inExport && <Badge>Not exported</Badge>}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-subtle">
                        {[TYPE_LABELS[field.type], field.unit, discomScope(field)].filter(Boolean).join(' · ')}
                        <span className="num ml-2 text-subtle/80">{field.key}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-0.5">
                      <IconButton icon={ArrowUp} label="Move up" disabled={index === 0} onClick={() => move(moveField, field, 'up')} />
                      <IconButton
                        icon={ArrowDown}
                        label="Move down"
                        disabled={index === own.length - 1}
                        onClick={() => move(moveField, field, 'down')}
                      />
                      <IconButton icon={Pencil} label="Edit" onClick={() => setFieldEditor({ field, defaults: {} })} />
                      {!field.system && (
                        <>
                          <IconButton
                            icon={field.archived ? ArchiveRestore : Archive}
                            label={field.archived ? 'Restore' : 'Archive'}
                            onClick={() => setArchived(field, !field.archived)}
                          />
                          <IconButton
                            icon={Trash2}
                            label="Delete"
                            onClick={() => setPendingDelete({ kind: 'field', item: field })}
                          />
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-6 text-sm text-subtle lg:px-6">No parameters in this section yet.</p>
            )}
          </section>
        );
      })}

      {fieldEditor && (
        <FieldFormModal
          field={fieldEditor.field}
          groups={groups}
          defaults={fieldEditor.defaults}
          onClose={() => setFieldEditor(null)}
        />
      )}

      {groupEditor && <GroupFormModal group={groupEditor.group} onClose={() => setGroupEditor(null)} />}

      {pendingDelete && (
        <ConfirmDialog
          title={pendingDelete.kind === 'field' ? 'Delete parameter' : 'Delete section'}
          message={
            pendingDelete.kind === 'field' ? (
              <>
                <strong className="font-semibold text-ink">{pendingDelete.item.label}</strong> will be removed from
                the form. A parameter that bills already have values for can only be archived.
              </>
            ) : (
              <>
                The empty section <strong className="font-semibold text-ink">{pendingDelete.item.title}</strong> will
                be removed.
              </>
            )
          }
          confirmLabel="Delete"
          loading={deleteField.isPending || deleteGroup.isPending}
          onConfirm={confirmDelete}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
