import { BellRing, Info, OctagonAlert, TriangleAlert } from 'lucide-react';
import Reveal from '../ui/Reveal.jsx';
import SectionHeader from './SectionHeader.jsx';

const CONDITIONS = [
  'PF below target',
  'Contract demand exceeded',
  'High maximum demand',
  'Sudden consumption increase',
  'Unusual bill increase',
  'Missing bill',
  'Tariff change',
  'PF penalty',
  'Demand penalty',
  'Solar generation deviation',
];

// Severity always travels with an icon and a word, never colour alone.
const SEVERITY = {
  critical: { label: 'Critical', icon: OctagonAlert, tone: 'bg-danger-soft text-danger-fg ring-danger-line' },
  warning: { label: 'Warning', icon: TriangleAlert, tone: 'bg-warn-soft text-warn-fg ring-warn-line' },
  notice: { label: 'Notice', icon: Info, tone: 'bg-neutral-soft text-neutral-fg ring-neutral-line' },
};

const FEED = [
  { severity: 'critical', title: 'PF penalty charged', site: 'Plant 02 · ₹48,200 on Aug bill' },
  { severity: 'warning', title: 'Contract demand exceeded', site: 'Warehouse · 562 of 500 kVA' },
  { severity: 'notice', title: 'Missing bill', site: 'Plant 01 · Sep 2026 not uploaded' },
];

export default function AlertsShowcase() {
  return (
    <section id="alerts" className="border-t border-line bg-surface py-20 sm:py-24">
      <div className="page-x grid w-full items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <SectionHeader
            eyebrow="Alerts"
            title="Know about problems before the next bill."
            description="EIP checks every bill against your targets and raises an alert when something costs you money."
          />

          <ul className="mt-8 flex flex-wrap gap-2">
            {CONDITIONS.map((condition, index) => (
              <Reveal
                as="li"
                key={condition}
                delay={index * 40}
                className="rounded-full border border-line bg-canvas px-3 py-1.5 text-sm font-medium text-muted"
              >
                {condition}
              </Reveal>
            ))}
          </ul>
        </div>

        <Reveal effect="scale" delay={150}>
          <div aria-label="Example alerts" className="card overflow-hidden rounded-2xl shadow-raised">
            <div className="flex items-center gap-2.5 border-b border-line bg-sunken px-5 py-4">
              <span className="grid size-9 place-items-center rounded-xl bg-accent text-on-accent">
                <BellRing className="size-4.5" />
              </span>
              <p className="text-sm font-semibold text-ink">Open alerts</p>
            </div>

            <ul className="divide-y divide-line">
              {FEED.map((item, index) => {
                const severity = SEVERITY[item.severity];
                const SeverityIcon = severity.icon;

                return (
                  <Reveal
                    as="li"
                    key={item.title}
                    delay={300 + index * 120}
                    className="flex items-center gap-3.5 px-5 py-4 transition hover:bg-hover"
                  >
                    <span className={`grid size-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset ${severity.tone}`}>
                      <SeverityIcon className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
                      <p className="truncate text-xs text-subtle">{item.site}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${severity.tone}`}>
                      {severity.label}
                    </span>
                  </Reveal>
                );
              })}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
