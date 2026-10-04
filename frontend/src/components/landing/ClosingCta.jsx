import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Reveal from '../ui/Reveal.jsx';
import { useSession } from '../../queries/auth.query.js';

export default function ClosingCta() {
  const { isAuthenticated } = useSession();

  return (
    <section className="page-x w-full py-20 sm:py-24">
      <Reveal
        effect="scale"
        className="relative overflow-hidden rounded-3xl bg-accent px-8 py-14 text-center text-on-accent sm:py-16"
      >
        <div aria-hidden className="bg-grid fade-edges pointer-events-none absolute inset-0 opacity-15" />

        <div className="relative">
          <h2 className="font-display text-3xl font-bold tracking-[-0.03em] text-balance sm:text-4xl">
            Start with your bills today.
          </h2>
          <p className="mt-3 opacity-70">Access is by invitation from your administrator.</p>

          <Link to={isAuthenticated ? '/bills' : '/login'} className="mt-8 inline-block">
            <Button size="lg" variant="secondary" className="group">
              {isAuthenticated ? 'Open dashboard' : 'Sign in'}
              <ArrowRight className="size-4.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
