import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as billService from '../services/bill.service.js';

// Cache keys for this resource. Invalidation never guesses at a shape.
export const billKeys = {
  all: ['bills'],
  list: (params) => ['bills', 'list', params],
  detail: (id) => ['bills', 'detail', id],
  stats: () => ['bills', 'stats'],
};

export const useBills = (params) =>
  useQuery({
    queryKey: billKeys.list(params),
    queryFn: () => billService.listBills(params),
    placeholderData: (prev) => prev, // no flicker while filtering
  });

export const useBill = (id) =>
  useQuery({
    queryKey: billKeys.detail(id),
    queryFn: () => billService.getBill(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000, // signed view URL is valid for an hour
  });

export const useBillStats = () =>
  useQuery({ queryKey: billKeys.stats(), queryFn: billService.getStats });

export const useUploadBill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, onProgress }) => billService.uploadBill(file, onProgress),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: billKeys.all }),
  });
};

export const useSaveParameters = (id) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (parameters) => billService.saveParameters(id, parameters),
    onSuccess: (bill) => {
      queryClient.setQueryData(billKeys.detail(id), (prev) => ({ ...prev, ...bill }));
      queryClient.invalidateQueries({ queryKey: billKeys.all });
    },
  });
};

export const useSubmitParameters = (id) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (parameters) => billService.submitParameters(id, parameters),
    onSuccess: (bill) => {
      queryClient.setQueryData(billKeys.detail(id), (prev) => ({ ...prev, ...bill }));
      queryClient.invalidateQueries({ queryKey: billKeys.all });
    },
  });
};

export const useDeleteBill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: billService.deleteBill,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: billKeys.all }),
  });
};
