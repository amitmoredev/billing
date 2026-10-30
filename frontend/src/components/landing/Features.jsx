import { BellRing, ChartColumn, ChartLine, CloudUpload, FileSearch, IndianRupee } from 'lucide-react';
import Reveal from '../ui/Reveal.jsx';
import SectionHeader from './SectionHeader.jsx';

// `live` features work today; the rest are marked as coming soon.
const FEATURES = [
  { icon: CloudUpload, title: 'Sites & bills', body: 'Upload bills by drag and drop, organised by site.', live: true },
  { icon: FileSearch, title: 'Bill viewer', body: 'Check every value against the original bill.', live: true },
  { icon: ChartLine, title: 'Automatic trends', body: '12, 24 and 36-month trends from your bills.' },
  { icon: BellRing, title: 'Alerts', body: 'Low power factor, demand overruns, missing bills.' },
  { icon: IndianRupee, title: 'Savings', body: 'Avoidable cost, potential savings and payback.' },
  { icon: ChartColumn, title: 'Site benchmarking', body: 'See which sites cost the most, and why.' },
];

export default function Features() {
  return (
    <section id="features" className="border-t border-line py-20 sm:py-24">
      <div className="page-x w-full">
        <SectionHeader
          eyebrow="Features"
          title="Everything about your energy, in one place."
          description="Start with clean, verified bills. Everything else is built on them."
        />

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body, live }, index) => (
            <Reveal as="li" key={title} delay={index * 70}>
              <article
                className="card group flex h-full gap-4 p-5 transition duration-300 hover:-translate-y-1
                  hover:border-line-strong hover:shadow-raised"
              >
                <span
                  className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-fg ring-1
                    ring-inset ring-accent-line transition duration-300 group-hover:bg-accent group-hover:text-on-accent"
                >
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
                    {title}
                    {live ? (
                      <span className="rounded-full bg-ok-soft px-2 py-0.5 text-[11px] font-semibold text-ok-fg ring-1 ring-inset ring-ok-line">
                        Live
                      </span>
                    ) : (
                      <span className="rounded-full bg-neutral-soft px-2 py-0.5 text-[11px] font-semibold text-neutral-fg ring-1 ring-inset ring-neutral-line">
                        Soon
                      </span>
                    )}
                  </h3>
                  <p className="mt-1 text-sm text-muted">{body}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
