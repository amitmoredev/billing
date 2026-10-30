import { useState } from 'react';
import { Plus, Save, Send } from 'lucide-react';
import TextField from '../ui/TextField.jsx';
import SelectField from '../ui/SelectField.jsx';
import Button from '../ui/Button.jsx';
import SiteFormModal from '../sites/SiteFormModal.jsx';
import { PARAMETER_GROUPS } from '../../constants/bill.constants.js';
import { useParameterForm } from '../../hooks/useParameterForm.js';
import { useSites } from '../../queries/site.query.js';
import { useToast } from '../../context/toast.context.js';
import { siteLabel } from '../../utils/format.js';

/** Right pane: the extraction form for one bill. */
export default function ParameterForm({ bill }) {
  const form = useParameterForm(bill);
  const toast = useToast();
  const { data: sites = [], isLoading: sitesLoading } = useSites();
  const [addingSite, setAddingSite] = useState(false);

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

          {PARAMETER_GROUPS.map((group) => (
            <section key={group.title} className="px-6 py-6">
              <h3 className="label-caps mb-4 flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-ink" aria-hidden />
                {group.title}
              </h3>
              <div className="grid items-start gap-x-4 gap-y-5 @sm:grid-cols-2 @3xl:grid-cols-3">
                {group.fields.map((field) => (
                  <TextField
                    key={field.name}
                    label={field.label}
                    type={field.type}
                    unit={field.unit}
                    hint={field.hint}
                    step={field.step}
                    max={field.max}
                    required={field.required}
                    error={form.errors[field.name]}
                    value={form.values[field.name]}
                    onChange={(e) => form.setField(field.name, e.target.value)}
                    placeholder={field.type === 'month' ? 'YYYY-MM' : '—'}
                  />
                ))}
              </div>
            </section>
          ))}
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

      {/* Outside the form: the dialog has a form of its own, and forms can't nest.
          A new site is picked for this bill straight away; saving the bill stores it. */}
      {addingSite && (
        <SiteFormModal
          onClose={() => setAddingSite(false)}
          onSaved={(site) => form.setField('site', site.id)}
        />
      )}
    </>
  );
}
