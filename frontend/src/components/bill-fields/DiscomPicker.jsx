import { Check } from 'lucide-react';
import { normalizeDiscom } from '../../utils/bill-fields.js';

/**
 * Which DISCOMs a field applies to, as toggles. None picked = every DISCOM,
 * which is what most fields want, so that is said plainly rather than shown
 * as an empty list.
 */
export default function DiscomPicker({ value, onChange, options, error, disabled = false, className = '' }) {
  const picked = new Set(value.map(normalizeDiscom));
  const toggle = (discom) =>
    onChange(
      picked.has(normalizeDiscom(discom))
        ? value.filter((d) => normalizeDiscom(d) !== normalizeDiscom(discom))
        : [...value, discom]
    );

  return (
    <fieldset className={`min-w-0 ${className}`} disabled={disabled}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <legend className="text-sm font-semibold text-muted">Applies to</legend>
        {value.length > 0 && !disabled && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="focus-ring rounded-lg px-1.5 py-0.5 text-xs font-semibold text-muted transition hover:bg-hover hover:text-ink"
          >
            All DISCOMs
          </button>
        )}
      </div>

      <p className="mb-2.5 text-xs text-subtle">
        {value.length
          ? `Only on bills from ${value.join(', ')}.`
          : 'Every DISCOM’s bills. Pick DISCOMs to show it only on theirs.'}
      </p>

      <div className="flex max-h-44 flex-wrap gap-1.5 overflow-y-auto rounded-xl bg-sunken p-2 ring-1 ring-inset ring-line">
        {options.map((discom) => {
          const on = picked.has(normalizeDiscom(discom));
          return (
            <button
              key={discom}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(discom)}
              className={`focus-ring inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold transition
                disabled:cursor-not-allowed disabled:opacity-60
                ${on ? 'bg-accent text-on-accent' : 'bg-surface text-muted ring-1 ring-inset ring-line hover:text-ink'}`}
            >
              {on && <Check className="size-3.5" />}
              {discom}
            </button>
          );
        })}
      </div>

      {error && <p className="mt-1.5 text-xs text-danger-fg">{error}</p>}
    </fieldset>
  );
}
