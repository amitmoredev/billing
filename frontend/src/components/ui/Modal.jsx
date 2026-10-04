import { useEffect, useId } from 'react';
import { X } from 'lucide-react';

/**
 * Centered dialog over a dimmed page. Escape, the backdrop and the close
 * button all call `onClose`. Children supply the body and any footer.
 */
export default function Modal({ title, description, onClose, children }) {
  const titleId = useId();

  useEffect(() => {
    const onKeyDown = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close dialog"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="card rise-in relative w-full max-w-md overflow-hidden shadow-float"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0">
            <h2 id={titleId} className="font-display text-lg font-bold tracking-tight text-ink">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="focus-ring -mr-2 -mt-1 grid size-9 shrink-0 place-items-center rounded-xl text-subtle
              transition hover:bg-hover hover:text-ink"
          >
            <X className="size-5" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

/** Bottom action row, shared so every dialog lines its buttons up the same way. */
export function ModalFooter({ children }) {
  return (
    <div className="flex justify-end gap-2.5 border-t border-line bg-sunken px-6 py-4">
      {children}
    </div>
  );
}
