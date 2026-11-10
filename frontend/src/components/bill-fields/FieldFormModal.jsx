import { useState } from 'react';
import { ListPlus, Lock, Save } from 'lucide-react';
import Modal, { ModalBody, ModalFooter } from '../ui/Modal.jsx';
import TextField from '../ui/TextField.jsx';
import SelectField from '../ui/SelectField.jsx';
import Switch from '../ui/Switch.jsx';
import Button from '../ui/Button.jsx';
import ErrorNote from '../ui/ErrorNote.jsx';
import DiscomPicker from './DiscomPicker.jsx';
import { useCreateField, useUpdateField } from '../../queries/bill-field.query.js';
import { useSites } from '../../queries/site.query.js';
import { FIELD_TYPE_OPTIONS, FIELD_TYPES } from '../../constants/bill.constants.js';
import { discomOptions } from '../../utils/bill-fields.js';
import { useToast } from '../../context/toast.context.js';

const blankToEmpty = (value) => (value == null ? '' : String(value));

/**
 * Add a bill parameter (no `field`) or edit one. `defaults` pre-fills a new
 * one — the section it was added from, the DISCOM of the bill being read.
 * A built-in field only takes a new label, hint and section: the analysis
 * reads the rest. Validation is the API's; errors land on their fields.
 */
export default function FieldFormModal({ field, groups, defaults = {}, onClose, onSaved }) {
  const isEdit = Boolean(field);
  const isSystem = Boolean(field?.system);
  const toast = useToast();
  const { data: sites = [] } = useSites();

  const createField = useCreateField();
  const updateField = useUpdateField();
  const save = isEdit ? updateField : createField;

  const [values, setValues] = useState({
    label: field?.label ?? '',
    hint: field?.hint ?? '',
    group: field?.group ?? defaults.group ?? groups[0]?.key ?? '',
    type: field?.type ?? FIELD_TYPES.NUMBER,
    unit: field?.unit ?? '',
    min: blankToEmpty(field?.min),
    max: blankToEmpty(field?.max),
    required: field?.required ?? false,
    discoms: field?.discoms ?? defaults.discoms ?? [],
    inExport: field?.inExport ?? true,
  });
  const setField = (name, value) => setValues((prev) => ({ ...prev, [name]: value }));
  const isNumber = values.type === FIELD_TYPES.NUMBER;

  const fieldErrors = save.error?.fieldErrors ?? {};
  const formError = save.error && !save.error.details.length ? save.error.message : null;

  const payload = () => {
    if (isSystem) return { label: values.label, hint: values.hint, group: values.group };
    const { type, ...rest } = values;
    const body = isNumber ? rest : { ...rest, unit: '', min: '', max: '' };
    return isEdit ? body : { ...body, type };
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    save.mutate(isEdit ? { id: field.id, ...payload() } : payload(), {
      onSuccess: (saved) => {
        toast.success(isEdit ? 'Parameter updated' : 'Parameter added', saved.label);
        onSaved?.(saved);
        onClose();
      },
    });
  };

  return (
    <Modal
      size="lg"
      title={isEdit ? 'Edit parameter' : 'Add parameter'}
      description={
        isEdit ? 'Changes apply to bills saved from now on.' : 'It shows on the bill form straight away.'
      }
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <ModalBody className="grid content-start gap-4 sm:grid-cols-2">
          {isSystem && (
            <p className="flex items-start gap-2 rounded-xl bg-sunken px-3.5 py-3 text-sm text-muted ring-1 ring-line sm:col-span-2">
              <Lock className="mt-0.5 size-4 shrink-0" />
              Built-in parameter: the analysis reads it, so only its label, hint and section can change.
            </p>
          )}

          <TextField
            label="Label"
            required
            autoFocus
            maxLength={80}
            placeholder="e.g. Wheeling Charge"
            value={values.label}
            onChange={(e) => setField('label', e.target.value)}
            error={fieldErrors.label}
          />
          <SelectField
            label="Section"
            required
            options={groups.map((group) => ({ value: group.key, label: group.title }))}
            value={values.group}
            onChange={(e) => setField('group', e.target.value)}
            error={fieldErrors.group}
          />

          {!isSystem && (
            <>
              <SelectField
                label="Type"
                options={FIELD_TYPE_OPTIONS}
                value={values.type}
                onChange={(e) => setField('type', e.target.value)}
                disabled={isEdit}
                hint={isEdit ? 'Fixed once added — values were saved as this type.' : 'Cannot be changed later.'}
                error={fieldErrors.type}
              />
              {isNumber ? (
                <TextField
                  label="Unit"
                  maxLength={20}
                  placeholder="Optional, e.g. ₹, kWh"
                  value={values.unit}
                  onChange={(e) => setField('unit', e.target.value)}
                  error={fieldErrors.unit}
                />
              ) : (
                <span className="hidden sm:block" />
              )}
              {isNumber && (
                <>
                  <TextField
                    label="Minimum"
                    type="number"
                    step="any"
                    placeholder="No minimum"
                    value={values.min}
                    onChange={(e) => setField('min', e.target.value)}
                    error={fieldErrors.min}
                  />
                  <TextField
                    label="Maximum"
                    type="number"
                    step="any"
                    placeholder="No maximum"
                    value={values.max}
                    onChange={(e) => setField('max', e.target.value)}
                    error={fieldErrors.max}
                  />
                </>
              )}
            </>
          )}

          <TextField
            label="Hint"
            maxLength={160}
            placeholder="Optional — where to find it on the bill"
            className="sm:col-span-2"
            value={values.hint}
            onChange={(e) => setField('hint', e.target.value)}
            error={fieldErrors.hint}
          />

          {!isSystem && (
            <>
              <DiscomPicker
                className="sm:col-span-2"
                value={values.discoms}
                onChange={(discoms) => setField('discoms', discoms)}
                options={discomOptions(sites, values.discoms)}
                error={fieldErrors.discoms}
              />
              <Switch
                label="Required to submit"
                description="Drafts can still be saved without it."
                checked={values.required}
                onChange={(checked) => setField('required', checked)}
              />
              <Switch
                label="Include in Excel export"
                description="As a column after the standard ones."
                checked={values.inExport}
                onChange={(checked) => setField('inExport', checked)}
              />
            </>
          )}

          {formError && <ErrorNote message={formError} className="sm:col-span-2" />}
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" icon={isEdit ? Save : ListPlus} loading={save.isPending}>
            {isEdit ? 'Save changes' : 'Add parameter'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
