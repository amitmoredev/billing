import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, BellRing, Building2 } from 'lucide-react';
import Button from '../ui/Button.jsx';
import HeroDashboard from './HeroDashboard.jsx';
import Reveal from '../ui/Reveal.jsx';
import { BRAND } from '../../constants/brand.constants.js';
import { useSession } from '../../queries/auth.query.js';

const PROOF_POINTS = [
  { icon: Building2, label: 'Every site in one place' },
  { icon: BellRing, label: 'Early alerts' },
  { icon: BadgeCheck, label: 'Verified bill data' },
];

export default function Hero() {
  const { isAuthenticated } = useSession();

  return (
    <section className="relative overflow-hidden">
      {/* Hairline grid that fades out behind the headline. */}
      <div aria-hidden className="bg-grid fade-edges pointer-events-none absolute inset-0 -z-10" />

      <div
        className="page-x grid w-full items-center gap-14 py-16 sm:py-24
          lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16"
      >
        <div className="max-w-xl">
          <Reveal>
            <span
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1
                text-xs font-semibold text-muted shadow-card"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok-fg opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-ok-fg" />
              </span>
              {BRAND.tagline}
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1
              className="mt-6 font-display text-[2.6rem] font-bold leading-[1.05] tracking-[-0.04em] text-balance
                text-ink sm:text-6xl"
            >
              Turn electricity bills into{' '}
              <span className="bg-linear-to-r from-ink to-subtle bg-clip-text text-transparent">
                energy savings.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-6 text-lg leading-relaxed text-muted">
              Upload bills from every site. EIP tracks the trends, flags problems early and connects
              you with the right people to fix them.
            </p>
          </Reveal>

          <Reveal delay={240} className="mt-9 flex flex-wrap gap-3">
            <Link to={isAuthenticated ? '/sites' : '/login'}>
              <Button size="lg" className="group">
                {isAuthenticated ? 'Open dashboard' : 'Sign in'}
                <ArrowRight className="size-4.5 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="secondary">
                Explore features
              </Button>
            </a>
          </Reveal>

          <Reveal as="ul" delay={320} className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-line pt-7">
            {PROOF_POINTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-sm font-medium text-muted">
                <Icon className="size-4.5 text-ink" />
                {label}
              </li>
            ))}
          </Reveal>
        </div>

        <Reveal effect="scale" delay={200}>
          <HeroDashboard />
        </Reveal>
      </div>
    </section>
  );
}
