import { useState } from 'react';
import { FolderPlus, Save } from 'lucide-react';
import Modal, { ModalBody, ModalFooter } from '../ui/Modal.jsx';
import TextField from '../ui/TextField.jsx';
import Button from '../ui/Button.jsx';
import ErrorNote from '../ui/ErrorNote.jsx';
import { useCreateGroup, useUpdateGroup } from '../../queries/bill-field.query.js';
import { useToast } from '../../context/toast.context.js';

/** Add a section to the bill form (no `group`) or rename one. */
export default function GroupFormModal({ group, onClose }) {
  const isEdit = Boolean(group);
  const toast = useToast();
  const createGroup = useCreateGroup();
  const updateGroup = useUpdateGroup();
  const save = isEdit ? updateGroup : createGroup;
  const [title, setTitle] = useState(group?.title ?? '');

  const fieldErrors = save.error?.fieldErrors ?? {};
  const formError = save.error && !save.error.details.length ? save.error.message : null;

  const handleSubmit = (event) => {
    event.preventDefault();
    save.mutate(isEdit ? { id: group.id, title } : { title }, {
      onSuccess: (saved) => {
        toast.success(isEdit ? 'Section renamed' : 'Section added', saved.title);
        onClose();
      },
    });
  };

  return (
    <Modal title={isEdit ? 'Rename section' : 'Add section'} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <ModalBody className="space-y-4">
          <TextField
            label="Section name"
            required
            autoFocus
            maxLength={80}
            placeholder="e.g. Charges"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={fieldErrors.title}
          />
          {formError && <ErrorNote message={formError} className="" />}
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" icon={isEdit ? Save : FolderPlus} loading={save.isPending}>
            {isEdit ? 'Save' : 'Add section'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
