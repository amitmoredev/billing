import { useState } from 'react';
import { ListPlus, Plus, Save, Send, TriangleAlert } from 'lucide-react';
import TextField from '../ui/TextField.jsx';
import SelectField from '../ui/SelectField.jsx';
import Button from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Spinner from '../ui/Spinner.jsx';
import SiteFormModal from '../sites/SiteFormModal.jsx';
import FieldFormModal from '../bill-fields/FieldFormModal.jsx';
import { FIELD_TYPES } from '../../constants/bill.constants.js';
import { ACTIONS, SUBJECTS } from '../../constants/permission.constants.js';
import { useParameterForm } from '../../hooks/useParameterForm.js';
import { useBillFields } from '../../queries/bill-field.query.js';
import { useSession } from '../../queries/auth.query.js';
import { useSites } from '../../queries/site.query.js';
import { useToast } from '../../context/toast.context.js';
import { fieldHint, fieldsForDiscom, toSections } from '../../utils/bill-fields.js';
import { siteLabel } from '../../utils/format.js';

/** Right pane: the extraction form for one bill, once its fields have loaded. */
export default function ParameterForm({ bill }) {
  const { data: definitions, isLoading, error } = useBillFields();

  if (isLoading) {
    return (
      <div className="grid h-full place-items-center">
        <Spinner className="size-7" />
      </div>
    );
  }
  if (error) {
    return <EmptyState icon={TriangleAlert} title="Could not load the form" description={error.message} />;
  }
  return <Form bill={bill} definitions={definitions} />;
}

/** One input per field, by type. Number inputs take any decimal the bill prints. */
function ParameterInput({ field, value, error, onChange }) {
  const isNumber = field.type === FIELD_TYPES.NUMBER;
  return (
    <TextField
      label={field.label}
      type={field.type}
      unit={field.unit || undefined}
      hint={fieldHint(field)}
      step={isNumber ? (field.step ?? 'any') : undefined}
      min={isNumber ? (field.min ?? undefined) : undefined}
      max={isNumber ? (field.max ?? undefined) : undefined}
      required={field.required}
      error={error}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.type === FIELD_TYPES.MONTH ? 'YYYY-MM' : '—'}
    />
  );
}

function Form({ bill, definitions }) {
  const toast = useToast();
  const { can } = useSession();
  const { data: sites = [], isLoading: sitesLoading } = useSites();
  const [addingSite, setAddingSite] = useState(false);
  const [addingField, setAddingField] = useState(null); // { group } while the dialog is open

  // The form follows the picked site's DISCOM: fields for every DISCOM, plus its own.
  const discomOf = (siteId) => sites.find((site) => site.id === siteId)?.discom ?? '';
  const form = useParameterForm(bill, {
    fieldsForSite: (siteId) => fieldsForDiscom(definitions.fields, discomOf(siteId)),
  });
  const discom = discomOf(form.values.site);
  const sections = toSections(definitions.groups, form.fields);
  const mayAddField = can(ACTIONS.CREATE, SUBJECTS.BILL_FIELD);

  // Values the bill holds for fields not on its form now — archived, or for
  // another DISCOM. Shown so nothing recorded is invisible; the API keeps them.
  const shown = new Set(form.fields.map((field) => field.key));
  const labels = new Map(definitions.fields.map((field) => [field.key, field.label]));
  const others = Object.entries(bill.parameters ?? {}).filter(
    ([key, value]) => !shown.has(key) && value !== null && value !== undefined && value !== ''
  );

  const handle = async (action, successTitle, successBody) => {
    const ok = await action();
    if (ok) toast.success(successTitle, successBody);
    else toast.error('Check the highlighted fields', 'Some values are missing or invalid.');
  };

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handle(form.submitAll, 'Parameters submitted', 'This bill is now marked as verified.');
        }}
        // A container: columns and footer follow this pane's width, not the window's.
        className="@container flex h-full min-h-0 flex-col"
      >
        <div className="shrink-0 border-b border-line bg-sunken px-6 py-5">
          <h2 className="font-display text-lg font-bold tracking-tight text-ink">
            Billing parameters
          </h2>
          <p className="mt-1 text-sm text-muted">
            Read the values off the bill on the left and fill them in here.
            {form.values.site &&
              (discom
                ? ` Showing the fields for ${discom} bills.`
                : ' This site has no DISCOM, so only fields for every DISCOM show.')}
          </p>
        </div>

        <div className="min-h-0 flex-1 divide-y divide-line overflow-y-auto">
          <section className="px-6 py-6">
            <h3 className="label-caps mb-4 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-ink" aria-hidden />
              Site
            </h3>
            <SelectField
              label="Site"
              required
              value={form.values.site}
              onChange={(e) => form.setField('site', e.target.value)}
              disabled={sitesLoading}
              placeholder={sitesLoading ? 'Loading sites…' : sites.length ? 'Choose a site' : 'No sites yet'}
              options={sites.map((site) => ({ value: site.id, label: siteLabel(site) }))}
              error={form.errors.site}
              hint={
              sites.length
                ? 'Picking another site moves this bill there when you save.'
                : 'Add the first site to file this bill under it.'
            }
              className="@sm:max-w-md"
              action={
                <button
                  type="button"
                  onClick={() => setAddingSite(true)}
                  className="focus-ring -my-1 inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-sm font-semibold
                    text-ink transition hover:bg-hover"
                >
                  <Plus className="size-4" />
                  New site
                </button>
              }
            />
          </section>

          {sections.map((group) => (
            <section key={group.key} className="px-6 py-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="label-caps flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-ink" aria-hidden />
                  {group.title}
                </h3>
                {mayAddField && (
                  <button
                    type="button"
                    onClick={() => setAddingField({ group: group.key })}
                    className="focus-ring -my-1 inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-semibold
                      text-muted transition hover:bg-hover hover:text-ink"
                  >
                    <ListPlus className="size-4" />
                    Add parameter
                  </button>
                )}
              </div>
              <div className="grid items-start gap-x-4 gap-y-5 @sm:grid-cols-2 @3xl:grid-cols-3">
                {group.fields.map((field) => (
                  <ParameterInput
                    key={field.key}
                    field={field}
                    value={form.values[field.key]}
                    error={form.errors[field.key]}
                    onChange={(value) => form.setField(field.key, value)}
                  />
                ))}
              </div>
            </section>
          ))}

          {others.length > 0 && (
            <section className="px-6 py-6">
              <h3 className="label-caps mb-1.5 flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-line-strong" aria-hidden />
                Other recorded values
              </h3>
              <p className="mb-4 text-xs text-subtle">
                Saved on this bill for fields not on its form now (archived, or for another DISCOM). Kept as recorded.
              </p>
              <dl className="grid gap-x-4 gap-y-3 @sm:grid-cols-2 @3xl:grid-cols-3">
                {others.map(([key, value]) => (
                  <div key={key} className="min-w-0 rounded-xl bg-sunken px-3.5 py-2.5 ring-1 ring-inset ring-line">
                    <dt className="truncate text-xs font-semibold text-subtle">{labels.get(key) ?? key}</dt>
                    <dd className="num truncate text-sm text-ink">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>

        {/* Narrow pane: status above two equal buttons. Wide pane: one row. */}
        <footer
          className="flex shrink-0 flex-col gap-3 border-t border-line bg-sunken px-6 py-4
            @xl:flex-row @xl:items-center @xl:justify-between"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-muted">
            <span
              className={`size-2 rounded-full ${
                form.isDirty ? 'animate-pulse bg-amber-500' : 'bg-emerald-500'
              }`}
            />
            {form.isDirty ? 'Unsaved changes' : 'All changes saved'}
          </span>

          <div className="grid grid-cols-2 gap-2.5 @xl:flex">
            <Button
              type="button"
              variant="secondary"
              icon={Save}
              loading={form.saving}
              disabled={!form.isDirty}
              onClick={() => handle(form.saveDraft, 'Draft saved', 'Your values are stored.')}
            >
              Save draft
            </Button>
            <Button type="submit" icon={Send} loading={form.submitting}>
              Submit
            </Button>
          </div>
        </footer>
      </form>

      {/* Outside the form: the dialogs have forms of their own, and forms can't nest.
          A new site is picked for this bill straight away; saving the bill stores it. */}
      {addingSite && (
        <SiteFormModal
          onClose={() => setAddingSite(false)}
          onSaved={(site) => form.setField('site', site.id)}
        />
      )}

      {/* A parameter added while reading a bill is most likely this DISCOM's own. */}
      {addingField && (
        <FieldFormModal
          groups={definitions.groups}
          defaults={{ group: addingField.group, discoms: discom ? [discom] : [] }}
          onClose={() => setAddingField(null)}
        />
      )}
    </>
  );
}
