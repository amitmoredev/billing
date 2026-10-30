import { Search, X } from 'lucide-react';

/** `className` sets the width; pass your own to let it grow inside a toolbar. */
export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search',
  className = 'w-full sm:w-96',
}) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute inset-y-0 left-3.5 my-auto size-4.5 text-subtle" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl bg-surface pl-11 pr-10 text-sm text-ink ring-1 ring-line transition
          placeholder:text-subtle hover:ring-line-strong focus:outline-none focus:ring-2 focus:ring-accent focus:shadow-focus"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="focus-ring absolute inset-y-0 right-2.5 my-auto grid size-7 place-items-center rounded-lg
            text-subtle transition hover:bg-hover hover:text-ink"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
