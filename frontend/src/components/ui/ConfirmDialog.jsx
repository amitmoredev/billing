import Modal, { ModalFooter } from './Modal.jsx';
import Button from './Button.jsx';

/** Yes/no question for destructive actions. */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  loading = false,
  onConfirm,
  onClose,
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="px-6 py-5 text-sm text-muted">{message}</p>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
