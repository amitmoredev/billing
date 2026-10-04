import { ArrowRight, Handshake, Lightbulb, ScanSearch } from 'lucide-react';
import Reveal from '../ui/Reveal.jsx';
import SectionHeader from './SectionHeader.jsx';

const STAGES = [
  { icon: ScanSearch, title: 'Identify', body: 'Spot abnormal consumption, penalties and demand overruns early.' },
  { icon: Lightbulb, title: 'Recommend', body: 'Get a clear next step, with the saving it is worth.' },
  { icon: Handshake, title: 'Connect', body: 'Reach the right service provider to fix it.' },
];

export default function ValueLoop() {
  return (
    <section className="border-t border-line bg-surface py-20 sm:py-24">
      <div className="page-x w-full">
        <SectionHeader
          centered
          eyebrow="Why EIP"
          title="From a problem on a bill to money saved."
        />

        <ol className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3 md:gap-8">
          {STAGES.map(({ icon: Icon, title, body }, index) => (
            <Reveal as="li" key={title} delay={index * 120} className="relative">
              <div className="card h-full p-6 text-center transition duration-300 hover:-translate-y-1 hover:shadow-raised">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-accent text-on-accent">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-sm text-muted">{body}</p>
              </div>

              {/* Arrow into the next stage, in the gutter between cards. */}
              {index < STAGES.length - 1 && (
                <span
                  aria-hidden
                  className="absolute -right-6 top-1/2 z-10 hidden size-8 -translate-y-1/2 place-items-center
                    rounded-full border border-line bg-surface text-subtle shadow-card md:grid"
                >
                  <ArrowRight className="size-4" />
                </span>
              )}
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
