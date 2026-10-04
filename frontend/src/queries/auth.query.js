import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as authService from '../services/auth.service.js';
import { hasPermission } from '../utils/permissions.js';

export const authKeys = {
  me: () => ['auth', 'me'],
};

/**
 * The single source of truth for "am I signed in". A 401 is an answer, not an
 * error to retry, so this never retries and the session check stays one request.
 */
export const useSession = () => {
  const query = useQuery({
    queryKey: authKeys.me(),
    queryFn: authService.getMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    user: query.data?.user ?? null,
    isAuthenticated: Boolean(query.data?.user),
    isChecking: query.isPending,
    /** The only permission check the UI makes — mirrors the API's. */
    can: (action, subject) => hasPermission(query.data?.permissions, action, subject),
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
    onSettled: () => queryClient.clear(), // drop every cached bill too
  });
};
