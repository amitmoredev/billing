import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const SIZES = { md: 'max-w-md', lg: 'max-w-2xl' };

/**
 * Centered dialog over a dimmed page. Escape, the backdrop and the close
 * button all call `onClose`. Children supply the body and any footer.
 *
 * Portalled to <body>: rendered in place, an animated ancestor (anything with
 * a transform) would trap `position: fixed`, leaving the sidebar uncovered
 * and the backdrop scrolling away with the page. The dialog never grows past
 * the screen; a tall body scrolls inside it (see ModalBody) while the title
 * and footer stay put.
 */
export default function Modal({ title, description, onClose, size = 'md', children }) {
  const titleId = useId();

  useEffect(() => {
    const onKeyDown = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center p-4 sm:p-8">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close dialog"
        onClick={onClose}
        className="fadein absolute inset-0 bg-backdrop backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`card rise-in relative flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden shadow-float
          sm:max-h-[calc(100dvh-4rem)] ${SIZES[size] ?? SIZES.md}`}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-6 py-5">
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

        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>,
    document.body
  );
}

/**
 * The part of a dialog that scrolls when it can't fit. A form wrapping body
 * and footer should be `flex min-h-0 flex-1 flex-col` so the footer stays put.
 */
export function ModalBody({ className = '', children }) {
  return <div className={`min-h-0 flex-1 overflow-y-auto px-6 py-5 ${className}`}>{children}</div>;
}

/** Bottom action row, shared so every dialog lines its buttons up the same way. */
export function ModalFooter({ children }) {
  return (
    <div className="flex shrink-0 justify-end gap-2.5 border-t border-line bg-sunken px-6 py-4">
      {children}
    </div>
  );
}
