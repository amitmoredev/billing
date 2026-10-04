import { useCallback, useMemo, useRef, useState } from 'react';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { ToastContext } from './toast.context.js';

const DEFAULT_DURATION = 4000;
const ERROR_DURATION = 6000;
const EXIT_MS = 200;
const MAX_VISIBLE = 3;

const VARIANTS = {
  success: { icon: CircleCheck, tone: 'bg-ok-soft text-ok-fg ring-ok-line', bar: 'bg-emerald-500' },
  error: {
    icon: CircleAlert,
    tone: 'bg-danger-soft text-danger-fg ring-danger-line',
    bar: 'bg-red-500',
  },
  info: { icon: Info, tone: 'bg-neutral-soft text-neutral-fg ring-neutral-line', bar: 'bg-ink' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    // Mark as leaving first so the exit animation can play, then unmount.
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), EXIT_MS);

    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    ({ title, description, variant = 'info', duration = DEFAULT_DURATION }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [
        ...prev.slice(-(MAX_VISIBLE - 1)),
        { id, title, description, variant, duration },
      ]);
      timers.current.set(id, window.setTimeout(() => dismiss(id), duration));
      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      toast,
      dismiss,
      success: (title, description) => toast({ title, description, variant: 'success' }),
      error: (title, description) =>
        toast({ title, description, variant: 'error', duration: ERROR_DURATION }),
      info: (title, description) => toast({ title, description, variant: 'info' }),
    }),
    [toast, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-100 flex flex-col items-center gap-3 p-4
        sm:inset-x-auto sm:right-6 sm:top-6 sm:bottom-auto sm:items-end sm:p-0"
    >
      {toasts.map((item) => (
        <Toast key={item.id} {...item} onDismiss={() => onDismiss(item.id)} />
      ))}
    </div>
  );
}

function Toast({ title, description, variant, duration, leaving, onDismiss }) {
  const { icon: IconComponent, tone, bar } = VARIANTS[variant] || VARIANTS.info;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-auto relative w-full max-w-md overflow-hidden rounded-2xl border border-line
        bg-elevated shadow-float ${leaving ? 'toast-out' : 'toast-in'} sm:w-96`}
    >
      <div className="flex items-start gap-3.5 p-4">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-xl ring-1 ring-inset ${tone}`}
        >
          <IconComponent className="size-5" />
        </span>

        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-bold text-ink">{title}</p>
          {description && <p className="mt-0.5 text-sm leading-snug text-muted">{description}</p>}
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="focus-ring -mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-lg text-subtle
            transition hover:bg-hover hover:text-ink"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Time-remaining bar; decorative, so it is hidden from the a11y tree. */}
      <span
        aria-hidden
        className={`absolute inset-x-0 bottom-0 h-0.5 origin-left ${bar} opacity-60`}
        style={{ animation: `toast-timer ${duration}ms linear forwards` }}
      />
    </div>
  );
}
