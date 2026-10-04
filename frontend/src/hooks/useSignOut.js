import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authKeys, useLogout } from '../queries/auth.query.js';

/**
 * Signs out and lands on `to`. The cached session is dropped before leaving,
 * so neither the guarded page being left nor a login screen at `to` acts on
 * it — without this, /admin/login would bounce a just-signed-out admin back in.
 */
export const useSignOut = (to) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const logout = useLogout();

  const signOut = () => {
    queryClient.setQueryData(authKeys.me(), null);
    navigate(to, { replace: true });
    logout.mutate();
  };

  return { signOut, signingOut: logout.isPending };
};
