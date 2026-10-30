import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as userService from '../services/user.service.js';

// Cache keys for this resource. Invalidation never guesses at a shape.
export const userKeys = {
  all: ['users'],
  list: (params) => ['users', 'list', params],
};

export const useUsers = (params) =>
  useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => userService.listUsers(params),
    placeholderData: (prev) => prev, // no flicker while searching or paging
  });

// Any change can shift rows between pages, so every list refetches — in the
// background. Returning the promise would hold the mutation (and its spinner)
// pending until the refetch finished.
const useUserMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
};

export const useCreateUser = () => useUserMutation(userService.createUser);

export const useUpdateUser = () =>
  useUserMutation(({ id, ...changes }) => userService.updateUser(id, changes));

export const useDeleteUser = () => useUserMutation(userService.deleteUser);
