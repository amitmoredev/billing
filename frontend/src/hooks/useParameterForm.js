import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSaveParameters, useSubmitParameters } from '../queries/bill.query.js';
import { billFieldKeys } from '../queries/bill-field.query.js';

// The bill's site travels with its parameters: one form, one save. Every value
// the bill holds is kept in the form, shown or not, so switching to another
// DISCOM's site and back loses nothing typed; the API keeps only what applies.
const toFormValues = (parameters = {}, site = null) => ({
  site: site?.id ?? '',
  ...Object.fromEntries(Object.entries(parameters ?? {}).map(([key, value]) => [key, value ?? ''])),
});

const differs = (a, b) =>
  [...new Set([...Object.keys(a), ...Object.keys(b)])].some((key) => String(a[key] ?? '') !== String(b[key] ?? ''));

/**
 * Owns parameter form state and both write paths (draft save, final submit).
 * `fieldsForSite(siteId)` gives the fields a bill at that site takes — they
 * follow the picked site's DISCOM — and comes back as `fields`.
 */
export const useParameterForm = (bill, { fieldsForSite }) => {
  const queryClient = useQueryClient();
  const initial = useMemo(
    () => toFormValues(bill?.parameters, bill?.site),
    [bill?.parameters, bill?.site]
  );
  const [values, setValues] = useState(initial);
  const [initialSnapshot, setInitialSnapshot] = useState(initial);
  const [errors, setErrors] = useState({});

  // Reset when a different bill loads.
  const [loadedId, setLoadedId] = useState(bill?.id);
  if (bill?.id && bill.id !== loadedId) {
    setLoadedId(bill.id);
    setValues(initial);
    setInitialSnapshot(initial);
    setErrors({});
  }

  const fields = fieldsForSite(values.site);
  const save = useSaveParameters(bill?.id);
  const submit = useSubmitParameters(bill?.id);

  const setField = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  };

  const isDirty = differs(values, initialSnapshot);

  const validateRequired = () => {
    const missing = {};
    if (!values.site) missing.site = 'Pick the site this bill belongs to';
    for (const field of fields) {
      if (field.required && String(values[field.key] ?? '').trim() === '') missing[field.key] = 'Required';
    }
    setErrors(missing);
    return Object.keys(missing).length === 0;
  };

  const run = async (mutation) => {
    try {
      const updated = await mutation.mutateAsync(values);
      setInitialSnapshot(toFormValues(updated.parameters, updated.site));
      setErrors({});
      return true;
    } catch (err) {
      setErrors(err.fieldErrors ?? {});
      // The form may have changed since it loaded (a field added or made
      // required); fetch it again so any field the API asked for shows up.
      if (err.status === 400) queryClient.invalidateQueries({ queryKey: billFieldKeys.all });
      return false;
    }
  };

  return {
    values,
    errors,
    fields,
    isDirty,
    setField,
    saveDraft: () => run(save),
    submitAll: () => (validateRequired() ? run(submit) : Promise.resolve(false)),
    saving: save.isPending,
    submitting: submit.isPending,
    saveError: save.error || submit.error,
  };
};
