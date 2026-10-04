import { Link } from 'react-router-dom';
import { BellRing, ChartLine, CircleCheck, IndianRupee } from 'lucide-react';
import BrandMark from '../ui/BrandMark.jsx';
import Reveal from '../ui/Reveal.jsx';
import ColumnChart from '../charts/ColumnChart.jsx';
import { CONSUMPTION_TREND, FINANCIALS } from '../../constants/showcase.constants.js';

const POINTS = [
  { icon: ChartLine, label: 'Automatic trends' },
  { icon: BellRing, label: 'Early alerts' },
  { icon: IndianRupee, label: 'Clear savings' },
];

/** Left half of the sign-in screen: a glimpse of the product beside the form. */
export default function AuthShowcase() {
  const trend = CONSUMPTION_TREND.slice(-12);

  return (
    <aside className="relative hidden overflow-hidden border-r border-line bg-sunken p-12 lg:flex lg:flex-col">
      <div aria-hidden className="bg-grid fade-edges pointer-events-none absolute inset-0" />

      <Reveal className="relative self-start">
        <Link to="/" className="focus-ring block rounded-xl">
          <BrandMark showTagline />
        </Link>
      </Reveal>

      {/* Decorative glimpse of the product, hidden from assistive tech. */}
      <div aria-hidden className="relative mx-auto my-auto w-full max-w-md py-12">
        <Reveal effect="scale" delay={120} className="card rounded-2xl p-5 shadow-raised">
          <p className="mb-4 text-sm font-semibold text-ink">Monthly consumption</p>
          <ColumnChart
            data={trend}
            flagged={trend.length - 1}
            flagLabel="+18%"
            formatValue={(value) => `${value} MWh`}
            labelEvery={2}
            className="h-36"
          />
        </Reveal>

        <Reveal
          delay={500}
          className="card absolute -right-6 top-0 flex items-center gap-3 p-3.5 pr-5 shadow-float xl:-right-10"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-ok-soft text-ok-fg ring-1 ring-inset ring-ok-line">
            <CircleCheck className="size-4.5" />
          </span>
          <div className="leading-tight">
            <p className="text-xs font-semibold text-subtle">Potential savings</p>
            <p className="text-base font-semibold text-ink proportional-nums">{FINANCIALS.potentialSavings} / yr</p>
          </div>
        </Reveal>
      </div>

      <Reveal delay={240} className="relative">
        <p className="max-w-md font-display text-3xl font-bold leading-tight tracking-tight text-balance text-ink">
          Every bill, every site, one place.
        </p>
        <ul className="mt-5 flex flex-wrap gap-2">
          {POINTS.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm
                font-medium text-muted"
            >
              <Icon className="size-4 text-ink" />
              {label}
            </li>
          ))}
        </ul>
      </Reveal>
    </aside>
  );
}
