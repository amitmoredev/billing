import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import OtpSignIn from '../../components/auth/OtpSignIn.jsx';
import AdminBrand from '../../components/layout/AdminBrand.jsx';
import ThemeToggle from '../../components/ui/ThemeToggle.jsx';
import { ADMIN_CONSOLE } from '../../constants/permission.constants.js';

/** Reached by URL only — nothing in the app links here. */
export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from?.pathname || '/admin/users';

  return (
    <div className="relative flex min-h-full flex-col overflow-hidden bg-canvas px-5 py-6 sm:px-10 sm:py-8">
      <div aria-hidden className="bg-grid fade-edges pointer-events-none absolute inset-0" />

      <div className="relative flex items-center justify-between">
        <AdminBrand />
        <ThemeToggle />
      </div>

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
        <div className="card rise-in rounded-3xl p-7 shadow-raised sm:p-10">
          <span className="mb-7 grid size-12 place-items-center rounded-2xl bg-accent text-on-accent">
            <ShieldCheck className="size-6" />
          </span>

          <OtpSignIn
            scope={ADMIN_CONSOLE.scope}
            title="Admin console"
            note="Only administrator accounts can sign in here."
            onSignedIn={() => navigate(redirectTo, { replace: true })}
          />
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Looking for your dashboard?{' '}
          <Link to="/login" className="focus-ring rounded font-semibold text-ink underline underline-offset-4">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
