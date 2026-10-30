import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as authService from '../services/auth.service.js';
import { hasPermission } from '../utils/permissions.js';

export const authKeys = {
  me: () => ['auth', 'me'],
};

/**
 * A 401 is an answer ("signed out"), not an error. Caching it as `null` keeps it
 * fresh like any other result — left as an error, every screen that mounts
 * would refetch it and sit in `pending` (a blank login page) until it returned.
 */
const getSession = async () => {
  try {
    return await authService.getMe();
  } catch (err) {
    if (err.status === 401) return null;
    throw err;
  }
};

/** The single source of truth for "am I signed in". */
export const useSession = () => {
  const query = useQuery({
    queryKey: authKeys.me(),
    queryFn: getSession,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    user: query.data?.user ?? null,
    isAuthenticated: Boolean(query.data?.user),
    isChecking: query.isPending,
    /** The only permission check the UI makes — mirrors the API's. Pass `record` to check one item. */
    can: (action, subject, record) =>
      hasPermission(query.data?.permissions, action, subject, record, query.data?.user?.id),
  };
};

export const useSendOtp = () => useMutation({ mutationFn: authService.sendOtp });

export const useVerifyOtp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authService.verifyOtp,
    // Seed the session cache from the login response — no extra /me round-trip.
    onSuccess: (data) => queryClient.setQueryData(authKeys.me(), data),
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authService.logout,
    onSettled: () => {
      queryClient.clear(); // drop every cached bill too
      // ...but keep "signed out" known, so the login screen doesn't re-check it.
      queryClient.setQueryData(authKeys.me(), null);
    },
  });
};
