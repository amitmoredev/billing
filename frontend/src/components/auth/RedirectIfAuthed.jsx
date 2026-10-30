import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '../../queries/auth.query.js';

/**
 * Keeps signed-in accounts off a login screen they don't need. With a
 * `permission`, only accounts holding it are sent on — anyone else still
 * sees the form and can sign in with a different number.
 */
export default function RedirectIfAuthed({ to = '/sites', permission }) {
  const { isAuthenticated, isChecking, can } = useSession();

  if (isChecking) return null; // brief; rendering the form then yanking it is worse
  if (isAuthenticated && (!permission || can(...permission))) return <Navigate to={to} replace />;

  return <Outlet />;
}
