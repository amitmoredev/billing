import { Link } from 'react-router-dom';
import BrandMark from '../ui/BrandMark.jsx';
import { BRAND } from '../../constants/brand.constants.js';

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#alerts', label: 'Alerts' },
  { href: '#providers', label: 'Providers' },
  { href: '#how-it-works', label: 'How it works' },
];

export default function LandingFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="page-x w-full py-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <Link to="/" className="focus-ring rounded-xl">
            <BrandMark showTagline />
          </Link>

          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
            {LINKS.map((link) => (
              <a key={link.href} href={link.href} className="text-sm font-medium text-muted transition hover:text-ink">
                {link.label}
              </a>
            ))}
            <Link to="/login" className="text-sm font-semibold text-ink transition hover:opacity-70">
              Sign in
            </Link>
          </nav>
        </div>

        <p className="mt-8 border-t border-line pt-6 text-xs text-subtle">
          © {new Date().getFullYear()} {BRAND.name} · {BRAND.tagline}
        </p>
      </div>
    </footer>
  );
}
