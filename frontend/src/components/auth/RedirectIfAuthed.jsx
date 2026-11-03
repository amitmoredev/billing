import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '../../queries/auth.query.js';

/**
 * Keeps signed-in accounts off a login screen they don't need. With a
 * `permission`, only accounts holding it are sent on — anyone else still
 * sees the form and can sign in with a different number.
 *
 * The form shows straight away, even while the session check is in flight:
 * a sleeping API can take many seconds to answer, and a blank screen for that
 * long is far worse than a signed-in user seeing the form for a moment before
 * being sent on. The check itself also wakes the API while the user types.
 */
export default function RedirectIfAuthed({ to = '/sites', permission }) {
  const { isAuthenticated, can } = useSession();

  if (isAuthenticated && (!permission || can(...permission))) return <Navigate to={to} replace />;

  return <Outlet />;
}
