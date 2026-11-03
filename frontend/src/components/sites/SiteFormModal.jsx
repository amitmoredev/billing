import { useState } from 'react';
import { MapPinPlus, Save } from 'lucide-react';
import Modal, { ModalFooter } from '../ui/Modal.jsx';
import TextField from '../ui/TextField.jsx';
import ComboboxField from '../ui/ComboboxField.jsx';
import SelectField from '../ui/SelectField.jsx';
import Button from '../ui/Button.jsx';
import ErrorNote from '../ui/ErrorNote.jsx';
import { useCreateSite, useSites, useUpdateSite } from '../../queries/site.query.js';
import { CATEGORY_SUGGESTIONS, DISCOM_SUGGESTIONS, INDIAN_STATES } from '../../constants/site.constants.js';
import { useToast } from '../../context/toast.context.js';

/**
 * Add a site (no `site` prop) or edit one. Validation is the API's; errors land
 * on their fields. `onSaved` gets the saved site, so a caller can select it.
 */
export default function SiteFormModal({ site, onClose, onSaved }) {
  const isEdit = Boolean(site);
  const toast = useToast();

  const createSite = useCreateSite();
  const updateSite = useUpdateSite();
  const save = isEdit ? updateSite : createSite;

  const [values, setValues] = useState({
    name: site?.name ?? '',
    code: site?.code ?? '',
    address: site?.address ?? '',
    discom: site?.discom ?? '',
    organisation: site?.organisation ?? '',
    state: site?.state ?? '',
    consumerCategory: site?.consumerCategory ?? '',
  });

  // Names already given to other sites come first, so the same organisation
  // or category isn't typed two different ways.
  const { data: sites = [] } = useSites();
  const used = (field) => [...new Set(sites.map((s) => s[field]).filter(Boolean))].sort();
  const organisations = used('organisation');
  const categories = [...new Set([...used('consumerCategory'), ...CATEGORY_SUGGESTIONS])];

  const setField = (name, value) => setValues((prev) => ({ ...prev, [name]: value }));

  const fieldErrors = save.error?.fieldErrors ?? {};
  // Field problems show inline; anything else shows once below.
  const formError = save.error && !save.error.details.length ? save.error.message : null;

  const handleSubmit = (event) => {
    event.preventDefault();

    save.mutate(isEdit ? { id: site.id, ...values } : values, {
      onSuccess: (saved) => {
        toast.success(isEdit ? 'Site updated' : 'Site added', saved.name);
        onSaved?.(saved);
        onClose();
      },
    });
  };

  return (
    <Modal
      title={isEdit ? 'Edit site' : 'Add site'}
      description={
        isEdit ? 'Bills at this site show the new details.' : 'Bills can be filed under it right away.'
      }
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-4 px-6 py-5">
          <TextField
            label="Site name"
            required
            autoFocus
            maxLength={120}
            placeholder="e.g. Pune Plant 2"
            value={values.name}
            onChange={(e) => setField('name', e.target.value)}
            error={fieldErrors.name}
          />
          <TextField
            label="Site code"
            maxLength={30}
            placeholder="Optional, e.g. PLT-02"
            hint="A short label shown next to the name"
            value={values.code}
            onChange={(e) => setField('code', e.target.value.toUpperCase())}
            error={fieldErrors.code}
          />
          <TextField
            label="Address"
            maxLength={300}
            placeholder="Optional"
            value={values.address}
            onChange={(e) => setField('address', e.target.value)}
            error={fieldErrors.address}
          />
          {/* Suggestions only — any other name can be typed in. */}
          <ComboboxField
            label="Discom"
            maxLength={120}
            placeholder="Optional, e.g. MSEDCL"
            hint="The distribution company that bills this site"
            options={DISCOM_SUGGESTIONS}
            value={values.discom}
            onChange={(value) => setField('discom', value)}
            error={fieldErrors.discom}
          />
          <ComboboxField
            label="Organisation"
            maxLength={120}
            placeholder="Optional, e.g. SAP Group"
            hint="The company or group the site belongs to"
            options={organisations}
            value={values.organisation}
            onChange={(value) => setField('organisation', value)}
            error={fieldErrors.organisation}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="State"
              placeholder="Not set"
              options={INDIAN_STATES.map((state) => ({ value: state, label: state }))}
              value={values.state}
              onChange={(e) => setField('state', e.target.value)}
              error={fieldErrors.state}
            />
            <ComboboxField
              label="Consumer category"
              maxLength={60}
              placeholder="Optional, e.g. HT Industrial"
              options={categories}
              value={values.consumerCategory}
              onChange={(value) => setField('consumerCategory', value)}
              error={fieldErrors.consumerCategory}
            />
          </div>

          {formError && <ErrorNote message={formError} className="" />}
        </div>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" icon={isEdit ? Save : MapPinPlus} loading={save.isPending}>
            {isEdit ? 'Save changes' : 'Add site'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
