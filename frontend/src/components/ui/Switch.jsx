/** On/off setting with a label. A real checkbox underneath, so keyboard and forms just work. */
export default function Switch({ label, description, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl bg-sunken p-4 ring-1 ring-line">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-subtle">{description}</span>}
      </span>

      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-line-strong transition
          after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white
          after:shadow-card after:transition peer-checked:bg-accent peer-checked:after:translate-x-5
          peer-checked:after:bg-on-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2
          peer-focus-visible:outline-accent"
      />
    </label>
  );
}
