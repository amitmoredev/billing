import { useId } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * A native select styled like the text inputs. `options` is [{ value, label }];
 * `placeholder` adds a first, empty option.
 */
export function Select({ options, placeholder, invalid = false, className = '', ...props }) {
  return (
    <div className={`relative ${className}`}>
      <select
        {...props}
        className={`h-12 w-full cursor-pointer appearance-none truncate rounded-xl bg-surface pl-3.5 pr-10 text-sm
          text-ink ring-1 transition hover:ring-line-strong focus:outline-none focus:ring-2
          disabled:cursor-not-allowed disabled:opacity-60
          ${invalid ? 'ring-danger-line focus:ring-red-400' : 'ring-line focus:ring-accent focus:shadow-focus'}`}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute inset-y-0 right-3.5 my-auto size-4.5 text-subtle" />
    </div>
  );
}

/**
 * Labelled select — same label, hint and error layout as TextField. `action`
 * sits at the label's right (e.g. a "New" button); the label is tied to the
 * select by id rather than by wrapping, so that button stays its own control.
 */
export default function SelectField({ label, hint, error, required, action, className = '', ...props }) {
  const id = useId();

  return (
    <div className={`min-w-0 ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={id} className="truncate text-sm font-semibold text-muted" title={label}>
          {label}
          {required && <span className="ml-0.5 text-danger-fg">*</span>}
        </label>
        {action}
      </div>

      <Select id={id} invalid={Boolean(error)} {...props} />

      {(error || hint) && (
        <p className={`mt-1.5 text-xs ${error ? 'text-danger-fg' : 'text-subtle'}`}>{error || hint}</p>
      )}
    </div>
  );
}
