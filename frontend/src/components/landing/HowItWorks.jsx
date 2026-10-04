import { BellRing, CloudUpload, Handshake } from 'lucide-react';
import Reveal from '../ui/Reveal.jsx';
import SectionHeader from './SectionHeader.jsx';

const STEPS = [
  { icon: CloudUpload, title: 'Upload', body: 'Add the electricity bills for each site.' },
  { icon: BellRing, title: 'Understand', body: 'Get trends, alerts and savings from every bill.' },
  { icon: Handshake, title: 'Act', body: 'Connect with the right service provider to fix it.' },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-line bg-surface py-20 sm:py-24">
      <div className="page-x w-full">
        <SectionHeader eyebrow="How it works" title="Three simple steps." />

        <ol className="mt-12 grid gap-10 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, index) => (
            <Reveal as="li" key={title} delay={index * 120} className="relative">
              {/* Connector, drawn only between steps on wide screens. */}
              {index < STEPS.length - 1 && (
                <span aria-hidden className="absolute left-16 right-0 top-6 hidden h-px bg-line md:block" />
              )}

              <span className="relative grid size-12 place-items-center rounded-2xl bg-accent text-on-accent">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-ink">
                <span className="num mr-2 text-subtle">{index + 1}.</span>
                {title}
              </h3>
              <p className="mt-1.5 text-sm text-muted">{body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
