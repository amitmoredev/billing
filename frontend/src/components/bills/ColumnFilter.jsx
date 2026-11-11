import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, X } from 'lucide-react';

const GAP = 6; // px between the header and its menu
const MENU_WIDTH = 224;
const MAX_MENU_HEIGHT = 320;
const SEARCH_FROM = 8; // a menu this long gets a box to narrow it

/**
 * A table column's header that doubles as its filter: the label opens a menu
 * of `options` ({ value, label }), headed by "All" (value ''). While a value
 * is picked the header is tinted and shows it, with a cross to clear it. The
 * menu is portalled to <body> so the table's `overflow: hidden` can't clip it.
 */
export default function ColumnFilter({ label, value, options, onChange }) {
  const id = useId();
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [needle, setNeedle] = useState('');
  const [position, setPosition] = useState(null);

  const selected = options.find((option) => option.value === value);
  const query = needle.trim().toLowerCase();
  const matches = query ? options.filter((option) => option.label.toLowerCase().includes(query)) : options;

  const choose = (next) => {
    onChange(next);
    setOpen(false);
  };

  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const rect = buttonRef.current.getBoundingClientRect();
      const left = Math.max(8, Math.min(rect.left - 8, window.innerWidth - MENU_WIDTH - 8));
      setPosition({
        top: rect.bottom + GAP,
        left,
        width: MENU_WIDTH,
        maxHeight: Math.min(MAX_MENU_HEIGHT, window.innerHeight - rect.bottom - GAP * 2),
      });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true); // capture: any scrolling ancestor counts
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  // A press outside, or Escape, closes the menu.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!buttonRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="flex min-w-0 items-center gap-1">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => {
          setNeedle('');
          setOpen((was) => !was);
        }}
        className={`focus-ring -mx-1.5 flex min-w-0 items-center gap-1 rounded-md px-1.5 py-0.5 transition
          ${selected ? 'bg-accent-soft text-accent-fg' : 'text-subtle hover:bg-hover hover:text-ink'}`}
      >
        <span className="label-caps truncate whitespace-nowrap text-current!">
          {selected ? selected.label : label}
        </span>
        <ChevronDown className={`size-3.5 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {selected && (
        <button
          type="button"
          aria-label={`Clear ${label} filter`}
          onClick={() => onChange('')}
          className="focus-ring grid size-5 shrink-0 place-items-center rounded text-subtle transition hover:bg-hover
            hover:text-ink"
        >
          <X className="size-3.5" />
        </button>
      )}

      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            style={position}
            className="fixed z-60 flex flex-col overflow-hidden rounded-xl border border-line bg-elevated shadow-float"
          >
            {options.length >= SEARCH_FROM && (
              <div className="border-b border-line p-1.5">
                <input
                  autoFocus
                  type="text"
                  value={needle}
                  onChange={(event) => setNeedle(event.target.value)}
                  placeholder={`Find ${label.toLowerCase()}`}
                  className="h-8 w-full rounded-lg bg-surface px-2.5 text-sm text-ink ring-1 ring-line
                    placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            )}

            <ul id={id} role="listbox" aria-label={label} className="overflow-y-auto p-1">
              {[{ value: '', label: 'All' }, ...matches].map((option) => {
                const isSelected = option.value === value;
                return (
                  <li key={option.value || 'all'} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => choose(option.value)}
                      className={`flex h-9 w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-sm
                        transition-colors hover:bg-hover hover:text-ink
                        ${isSelected ? 'font-semibold text-ink' : 'text-muted'}`}
                    >
                      <span className="num truncate">{option.label}</span>
                      {isSelected && <Check className="size-4 shrink-0" />}
                    </button>
                  </li>
                );
              })}
              {query && !matches.length && (
                <li className="px-3 py-2.5 text-sm text-subtle">Nothing matches “{needle.trim()}”</li>
              )}
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
}
