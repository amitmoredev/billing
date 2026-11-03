import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSession } from '../../queries/auth.query.js';
import Spinner from '../ui/Spinner.jsx';
import { WAKING_SERVER_HINT, useSlowHint } from '../../hooks/useSlowHint.js';

/**
 * Gate for signed-in areas. Remembers where the user was headed. With a
 * `permission` ([action, subject]), an account that lacks it goes to
 * `loginPath` too, so someone with access can sign in there.
 */
export default function RequireAuth({ loginPath = '/login', permission }) {
  const location = useLocation();
  const { isAuthenticated, isChecking, can } = useSession();
  const slow = useSlowHint(isChecking);

  // A signed-in page can't render before the session is known, so this one waits.
  if (isChecking) {
    return (
      <div className="grid h-full place-items-center bg-canvas px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Spinner className="size-6" />
          {slow && <p className="max-w-xs text-sm text-muted">{WAKING_SERVER_HINT}</p>}
        </div>
      </div>
    );
  }

  const allowed = isAuthenticated && (!permission || can(...permission));
  if (!allowed) return <Navigate to={loginPath} replace state={{ from: location }} />;

  return <Outlet />;
}
