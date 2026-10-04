import Reveal from '../ui/Reveal.jsx';

/** Eyebrow, title and lede — the same opening for every landing section. */
export default function SectionHeader({ eyebrow, title, description, centered = false }) {
  return (
    <Reveal className={`max-w-2xl ${centered ? 'mx-auto text-center' : ''}`}>
      <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted">
        <span className="size-1.5 rounded-full bg-accent" aria-hidden />
        {eyebrow}
      </p>
      <h2 className="display-title mt-5 text-balance">{title}</h2>
      {description && (
        <p className="mt-4 text-lg leading-relaxed text-pretty text-muted">{description}</p>
      )}
    </Reveal>
  );
}
