import { useMemo, useState } from 'react';
import { PARAMETER_FIELDS } from '../constants/bill.constants.js';
import { useSaveParameters, useSubmitParameters } from '../queries/bill.query.js';

const toFormValues = (parameters = {}) =>
  Object.fromEntries(
    PARAMETER_FIELDS.map((field) => [field.name, parameters[field.name] ?? ''])
  );

/** Owns parameter form state and both write paths (draft save, final submit). */
export const useParameterForm = (bill) => {
  const initial = useMemo(() => toFormValues(bill?.parameters), [bill?.parameters]);
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

  const save = useSaveParameters(bill?.id);
  const submit = useSubmitParameters(bill?.id);

  const setField = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  };

  const isDirty = PARAMETER_FIELDS.some(
    (field) => String(values[field.name] ?? '') !== String(initialSnapshot[field.name] ?? '')
  );

  const validateRequired = () => {
    const missing = {};
    for (const field of PARAMETER_FIELDS) {
      if (field.required && String(values[field.name] ?? '').trim() === '') {
        missing[field.name] = 'Required';
      }
    }
    setErrors(missing);
    return Object.keys(missing).length === 0;
  };

  const run = async (mutation) => {
    try {
      const updated = await mutation.mutateAsync(values);
      setInitialSnapshot(toFormValues(updated.parameters));
      setErrors({});
      return true;
    } catch (err) {
      setErrors(err.fieldErrors ?? {});
      return false;
    }
  };

  return {
    values,
    errors,
    isDirty,
    setField,
    saveDraft: () => run(save),
    submitAll: () => (validateRequired() ? run(submit) : Promise.resolve(false)),
    saving: save.isPending,
    submitting: submit.isPending,
    saveError: save.error || submit.error,
  };
};
