import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

const GAP = 6; // px between the input and its list
const MAX_LIST_HEIGHT = 264;
const OPTION_HEIGHT = 38; // for sizing the list before it has rendered

/**
 * A text input with a suggestion list — free text, so a value that isn't in
 * `options` is still accepted. Laid out like TextField. The list is portalled
 * to <body> with fixed positioning, so a dialog's `overflow: hidden` can't clip
 * it, and it opens upward when there's no room below.
 */
export default function ComboboxField({
  label,
  hint,
  error,
  required,
  value,
  onChange,
  options,
  placeholder,
  maxLength,
  className = '',
}) {
  const id = useId();
  const listId = `${id}-list`;
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState(''); // what was typed since opening; empty shows everything
  const [active, setActive] = useState(-1);
  const [position, setPosition] = useState(null);

  const needle = filter.trim().toLowerCase();
  const matches = needle ? options.filter((option) => option.toLowerCase().includes(needle)) : options;

  const openList = () => {
    setFilter('');
    setActive(Math.max(0, options.indexOf(value)));
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setActive(-1);
  };

  const choose = (option) => {
    onChange(option);
    close();
  };

  // Place the list against the input; re-place on scroll and resize while open.
  useLayoutEffect(() => {
    if (!open) return undefined;

    const place = () => {
      const rect = inputRef.current.getBoundingClientRect();
      const wanted = Math.min(MAX_LIST_HEIGHT, Math.max(1, matches.length) * OPTION_HEIGHT + 8);
      const below = window.innerHeight - rect.bottom - GAP * 2;
      const above = rect.top - GAP * 2;
      const upward = below < wanted && above > below;

      setPosition({
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(MAX_LIST_HEIGHT, upward ? above : below),
        ...(upward ? { bottom: window.innerHeight - rect.top + GAP } : { top: rect.bottom + GAP }),
      });
    };

    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true); // capture: any scrolling ancestor counts
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, matches.length]);

  // A press anywhere outside the input and the list closes it.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!wrapRef.current?.contains(event.target) && !listRef.current?.contains(event.target)) {
        setOpen(false);
        setActive(-1);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // Keep the keyboard-highlighted option in view.
  useEffect(() => {
    if (open && active >= 0) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const onKeyDown = (event) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) openList();
        else setActive((i) => Math.min(i + 1, matches.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (open) setActive((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        // Pick the highlighted suggestion instead of submitting the form.
        if (open && matches[active]) {
          event.preventDefault();
          choose(matches[active]);
        }
        break;
      case 'Escape':
        // Close just the list — not the dialog around it.
        if (open) {
          event.stopPropagation();
          close();
        }
        break;
      case 'Tab':
        close();
        break;
      default:
    }
  };

  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={id} className="mb-2 block truncate text-sm font-semibold text-muted" title={label}>
        {label}
        {required && <span className="ml-0.5 text-danger-fg">*</span>}
      </label>

      <div ref={wrapRef} className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
          maxLength={maxLength}
          placeholder={placeholder}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setFilter(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onClick={() => !open && openList()}
          onKeyDown={onKeyDown}
          className={`h-12 w-full rounded-xl bg-surface pl-3.5 pr-11 text-sm text-ink ring-1 transition
            placeholder:text-subtle hover:ring-line-strong focus:outline-none focus:ring-2
            ${error ? 'ring-danger-line focus:ring-red-400' : 'ring-line focus:ring-accent focus:shadow-focus'}`}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? 'Hide suggestions' : 'Show suggestions'}
          onMouseDown={(event) => event.preventDefault()} // keep focus in the input
          onClick={() => {
            if (open) close();
            else openList();
            inputRef.current?.focus();
          }}
          className="absolute inset-y-0 right-1.5 my-auto grid size-9 place-items-center rounded-lg text-subtle
            transition hover:bg-hover hover:text-ink"
        >
          <ChevronDown className={`size-4.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {(error || hint) && (
        <p className={`mt-1.5 text-xs ${error ? 'text-danger-fg' : 'text-subtle'}`}>{error || hint}</p>
      )}

      {open &&
        position &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            style={position}
            className="fixed z-60 overflow-y-auto rounded-xl border border-line bg-elevated p-1 shadow-float"
          >
            {matches.length ? (
              matches.map((option, index) => {
                const selected = option === value;
                return (
                  <li
                    key={option}
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={selected}
                    onMouseDown={(event) => event.preventDefault()} // keep focus in the input
                    onClick={() => choose(option)}
                    onMouseMove={() => setActive(index)}
                    className={`flex h-9.5 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 text-sm
                      transition-colors ${index === active ? 'bg-hover text-ink' : 'text-muted'}
                      ${selected ? 'font-semibold text-ink' : ''}`}
                  >
                    <span className="truncate">{option}</span>
                    {selected && <Check className="size-4 shrink-0" />}
                  </li>
                );
              })
            ) : (
              <li className="px-3 py-2.5 text-sm text-subtle">
                No suggestion — “{filter.trim()}” will be saved as typed.
              </li>
            )}
          </ul>,
          document.body
        )}
    </div>
  );
}
