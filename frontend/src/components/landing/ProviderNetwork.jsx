import { CircuitBoard, Factory } from 'lucide-react';
import Reveal from '../ui/Reveal.jsx';
import SectionHeader from './SectionHeader.jsx';

const PROVIDERS = [
  {
    icon: CircuitBoard,
    title: 'APFC repair & maintenance',
    body: 'Fix low power factor and stop paying PF penalties.',
  },
  {
    icon: Factory,
    title: 'Contract demand reduction',
    body: 'Right-size contract demand and cut fixed charges.',
  },
];

export default function ProviderNetwork() {
  return (
    <section id="providers" className="border-t border-line py-20 sm:py-24">
      <div className="page-x w-full">
        <SectionHeader
          centered
          eyebrow="Service providers"
          title="The right expert, one click away."
          description="When EIP finds a problem, it connects you with providers who fix exactly that."
        />

        <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
          {PROVIDERS.map(({ icon: Icon, title, body }, index) => (
            <Reveal key={title} delay={index * 120}>
              <article
                className="card group flex h-full items-start gap-5 p-6 transition duration-300 hover:-translate-y-1
                  hover:border-line-strong hover:shadow-raised"
              >
                <span
                  className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent text-on-accent transition
                    duration-300 group-hover:scale-105"
                >
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="flex flex-wrap items-center gap-2 text-lg font-semibold text-ink">
                    {title}
                    <span className="rounded-full bg-neutral-soft px-2 py-0.5 text-[11px] font-semibold text-neutral-fg ring-1 ring-inset ring-neutral-line">
                      Soon
                    </span>
                  </h3>
                  <p className="mt-1.5 text-sm text-muted">{body}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
