import { useState } from 'react';
import { Save, UserPlus } from 'lucide-react';
import Modal, { ModalFooter } from '../ui/Modal.jsx';
import TextField from '../ui/TextField.jsx';
import Switch from '../ui/Switch.jsx';
import Button from '../ui/Button.jsx';
import ErrorNote from '../ui/ErrorNote.jsx';
import { useCreateUser, useUpdateUser } from '../../queries/user.query.js';
import { useToast } from '../../context/toast.context.js';
import { displayName } from '../../utils/format.js';

const digitsOnly = (value) => value.replace(/\D/g, '').slice(0, 10);

/** Add a user (no `user` prop) or edit one. Validation is the API's; errors land on their fields. */
export default function UserFormModal({ user, onClose }) {
  const isEdit = Boolean(user);
  const toast = useToast();

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const save = isEdit ? updateUser : createUser;

  const [values, setValues] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
    isActive: user?.isActive ?? true,
  });

  const setField = (name, value) => setValues((prev) => ({ ...prev, [name]: value }));

  const fieldErrors = save.error?.fieldErrors ?? {};
  // Field problems show inline; anything else (e.g. a number already taken) shows once below.
  const formError = save.error && !save.error.details.length ? save.error.message : null;

  const handleSubmit = (event) => {
    event.preventDefault();

    const { isActive, ...fields } = values;
    const payload = isEdit ? { id: user.id, ...fields, isActive } : fields;

    save.mutate(payload, {
      onSuccess: (saved) => {
        toast.success(
          isEdit ? 'User updated' : 'User added',
          isEdit ? displayName(saved) : `${displayName(saved)} can now sign in.`
        );
        onClose();
      },
    });
  };

  return (
    <Modal
      title={isEdit ? 'Edit user' : 'Add user'}
      description={
        isEdit
          ? 'Changes take effect immediately.'
          : "They'll sign in with a WhatsApp code sent to this number."
      }
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <TextField
            label="Name"
            required
            autoFocus
            maxLength={120}
            placeholder="Full name"
            value={values.name}
            onChange={(e) => setField('name', e.target.value)}
            error={fieldErrors.name}
          />
          <TextField
            label="Mobile number"
            required
            type="tel"
            inputMode="numeric"
            autoComplete="off"
            placeholder="98765 43210"
            hint="10 digits, without +91"
            value={values.phone}
            onChange={(e) => setField('phone', digitsOnly(e.target.value))}
            error={fieldErrors.phone}
          />
          <TextField
            label="Email"
            type="email"
            placeholder="Optional"
            value={values.email}
            onChange={(e) => setField('email', e.target.value)}
            error={fieldErrors.email}
          />

          {isEdit && (
            <Switch
              label="Allow sign-in"
              description="Turn off to block access without deleting the account."
              checked={values.isActive}
              onChange={(isActive) => setField('isActive', isActive)}
            />
          )}

          {formError && <ErrorNote message={formError} className="" />}
        </div>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" icon={isEdit ? Save : UserPlus} loading={save.isPending}>
            {isEdit ? 'Save changes' : 'Add user'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
