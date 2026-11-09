import { Sparkles } from 'lucide-react';

/**
 * Stands in for a tab that isn't switched on yet: a calm card with the
 * section's icon, a "Coming soon" pill, one line on what it will do and the
 * features to expect. A faint grid behind it keeps it from reading as empty.
 *
 * features: [{ icon, label }]
 */
export default function ComingSoon({ icon: IconComponent, title, description, features }) {
  return (
    <section className="card relative overflow-hidden px-6 py-14 text-center sm:py-20">
      <div aria-hidden className="bg-grid fade-edges pointer-events-none absolute inset-0 opacity-70" />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-10 size-72 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-xl">
        <div className="relative mx-auto grid size-16 place-items-center">
          <span aria-hidden className="absolute inset-0 animate-ping rounded-2xl bg-accent/15 [animation-duration:2.4s]" />
          <span
            className="relative grid size-16 place-items-center rounded-2xl bg-linear-to-br from-[#3a64c4] to-[#2f53a8]
              text-white shadow-[0_10px_28px_-12px_rgb(47_83_168/0.6)] ring-1 ring-inset ring-white/15"
          >
            <IconComponent className="size-7" />
          </span>
        </div>

        <span
          className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold
            text-accent-fg ring-1 ring-inset ring-accent-line"
        >
          <Sparkles className="size-3.5" />
          Coming soon
        </span>

        <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">{description}</p>

        <ul className="mt-7 flex flex-wrap justify-center gap-2">
          {features.map(({ icon: FeatureIcon, label }) => (
            <li
              key={label}
              className="inline-flex items-center gap-2 rounded-full bg-surface px-3.5 py-2 text-sm font-medium text-ink
                shadow-card ring-1 ring-inset ring-line"
            >
              <FeatureIcon className="size-4 text-accent-fg" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
