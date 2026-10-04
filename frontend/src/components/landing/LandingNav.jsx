import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';
import BrandMark from '../ui/BrandMark.jsx';
import Button from '../ui/Button.jsx';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import { useSession } from '../../queries/auth.query.js';

const LINKS = [
  { id: 'features', label: 'Features' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'providers', label: 'Providers' },
  { id: 'how-it-works', label: 'How it works' },
];

// Hoisted so the observer effect below has a stable dependency.
const LINK_IDS = LINKS.map((link) => link.id);

/** True once the page has moved off the very top. */
const useScrolled = (offset = 8) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > offset);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [offset]);

  return scrolled;
};

/** Which section is currently in view, so the matching pill can light up. */
const useActiveSection = (ids) => {
  const [active, setActive] = useState('');

  useEffect(() => {
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!sections.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActive(visible[0].target.id);
      },
      // Only the band just under the header counts as "in view".
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [ids]);

  return active;
};

export default function LandingNav() {
  const { isAuthenticated } = useSession();
  const scrolled = useScrolled();
  const active = useActiveSection(LINK_IDS);
  const [menuOpen, setMenuOpen] = useState(false);

  // Escape closes the mobile sheet.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (event) => event.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const ctaLabel = isAuthenticated ? 'Open dashboard' : 'Sign in';
  const ctaTo = isAuthenticated ? '/bills' : '/login';

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300
        ${
          scrolled || menuOpen
            ? 'border-b border-line bg-surface/80 shadow-card backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent'
        }`}
    >
      <div className="page-x relative flex h-16 w-full items-center gap-3 sm:h-18">
        <Link
          to="/"
          className="focus-ring shrink-0 rounded-xl"
          onClick={() => setMenuOpen(false)}
        >
          <BrandMark />
        </Link>

        {/* Centred on the viewport, so the brand's width never shifts it. */}
        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border
            border-line bg-surface/70 p-1 shadow-card backdrop-blur-xl lg:flex"
        >
          {LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className={`focus-ring rounded-full px-4 py-2 text-sm font-semibold transition
                ${
                  active === link.id
                    ? 'bg-accent-soft text-ink'
                    : 'text-muted hover:bg-hover hover:text-ink'
                }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <ThemeToggle />

          <Link to={ctaTo} className="hidden sm:block">
            <Button size="sm" className="group">
              {ctaLabel}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="focus-ring grid size-10 place-items-center rounded-xl border border-line bg-surface
              text-muted transition hover:border-line-strong hover:bg-hover hover:text-ink lg:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="page-x rise-in border-t border-line bg-surface pb-5 pt-3 lg:hidden">
          <nav className="flex flex-col">
            {LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={() => setMenuOpen(false)}
                className="focus-ring rounded-xl px-3 py-3.5 text-base font-semibold text-muted
                  transition hover:bg-hover hover:text-ink"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <Link to={ctaTo} onClick={() => setMenuOpen(false)} className="mt-3 block">
            <Button size="lg" className="w-full">
              {ctaLabel}
              <ArrowRight className="size-4.5" />
            </Button>
          </Link>
        </div>
      )}
    </header>
  );
}
