export default function TextField({ label, unit, hint, error, required, className = '', ...props }) {
  // Readings and dates line up column to column; free text stays in the UI face.
  const isFigure = props.type === 'number' || props.type === 'month';

  return (
    <label className={`block min-w-0 ${className}`}>
      {/* One line, always: a wrapped label would push its input out of line with its neighbours. */}
      <span className="mb-2 block truncate text-sm font-semibold text-muted" title={label}>
        {label}
        {required && <span className="ml-0.5 text-danger-fg">*</span>}
      </span>

      <div className="relative">
        <input
          {...props}
          className={`h-12 w-full rounded-xl bg-surface px-3.5 text-sm text-ink ring-1 transition
            placeholder:font-sans placeholder:text-subtle hover:ring-line-strong focus:outline-none focus:ring-2
            ${isFigure ? 'num' : ''}
            ${unit ? 'pr-16' : ''}
            ${error ? 'ring-danger-line focus:ring-red-400' : 'ring-line focus:ring-ink'}`}
        />
        {unit && (
          <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-semibold text-subtle">
            {unit}
          </span>
        )}
      </div>

      {(error || hint) && (
        <span className={`mt-1.5 block text-xs ${error ? 'text-danger-fg' : 'text-subtle'}`}>
          {error || hint}
        </span>
      )}
    </label>
  );
}
