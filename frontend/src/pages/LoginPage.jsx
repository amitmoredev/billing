import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AuthShowcase from '../components/auth/AuthShowcase.jsx';
import OtpSignIn from '../components/auth/OtpSignIn.jsx';
import BrandMark from '../components/ui/BrandMark.jsx';
import ThemeToggle from '../components/ui/ThemeToggle.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from?.pathname || '/sites';

  return (
    <div className="grid min-h-full bg-canvas lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <AuthShowcase />

      <main className="flex flex-col px-5 py-6 sm:px-10 sm:py-8">
        <div className="flex items-center justify-between gap-3">
          {/* Small screens lose the showcase, so the brand moves up here. */}
          <Link to="/" className="focus-ring rounded-xl lg:hidden">
            <BrandMark size="sm" />
          </Link>
          <Link
            to="/"
            className="focus-ring hidden items-center gap-1.5 rounded-lg px-1 py-1 text-sm font-semibold text-muted
              transition hover:text-ink lg:inline-flex"
          >
            <ArrowLeft className="size-4" />
            Back to home
          </Link>
          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <OtpSignIn onSignedIn={() => navigate(redirectTo, { replace: true })} />
        </div>
      </main>
    </div>
  );
}
