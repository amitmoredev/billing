import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as billService from '../services/bill.service.js';
import { siteKeys } from './site.query.js';

// Cache keys for this resource. Invalidation never guesses at a shape.
export const billKeys = {
  all: ['bills'],
  lists: () => ['bills', 'list'],
  list: (params) => ['bills', 'list', params],
  detail: (id) => ['bills', 'detail', id],
  allStats: () => ['bills', 'stats'],
  stats: (params) => ['bills', 'stats', params],
};

/** Bills per request; the list asks for the next batch as the reader scrolls down. */
export const BILLS_PAGE_SIZE = 10;

/**
 * Bills a page at a time. `data.pages` holds every batch loaded so far;
 * `fetchNextPage` loads the next one, `hasNextPage` says whether there is one.
 * Invalidating the lists refetches every loaded page, so nothing goes stale.
 */
export const useInfiniteBills = (params, { pageSize = BILLS_PAGE_SIZE } = {}) =>
  useInfiniteQuery({
    queryKey: billKeys.list({ ...params, limit: pageSize }),
    queryFn: ({ pageParam }) => billService.listBills({ ...params, page: pageParam, limit: pageSize }),
    initialPageParam: 1,
    getNextPageParam: ({ pagination }) =>
      pagination.page < pagination.pages ? pagination.page + 1 : undefined,
    placeholderData: (prev) => prev, // no flicker while filtering
  });

export const useBill = (id) =>
  useQuery({
    queryKey: billKeys.detail(id),
    queryFn: () => billService.getBill(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000, // signed view URL is valid for an hour
  });

export const useBillStats = (params) =>
  useQuery({
    queryKey: billKeys.stats(params),
    queryFn: () => billService.getStats(params),
    placeholderData: (prev) => prev, // tiles keep their numbers while the site filter changes
  });

// Refetch lists, stats and per-site bill counts in the background. Never return
// this promise from `onSuccess`: the mutation would stay pending (spinner and
// all) until every refetch finished.
const refreshLists = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: billKeys.lists() });
  queryClient.invalidateQueries({ queryKey: billKeys.allStats() });
  queryClient.invalidateQueries({ queryKey: siteKeys.all });
};

export const useUploadBill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, onProgress, siteId }) => billService.uploadBill(file, { onProgress, siteId }),
    onSuccess: () => refreshLists(queryClient),
  });
};

// The response is the updated bill, so the detail cache is written, not refetched.
const useParameterMutation = (id, mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (bill) => {
      queryClient.setQueryData(billKeys.detail(id), (prev) => ({ ...prev, ...bill }));
      refreshLists(queryClient);
    },
  });
};

export const useSaveParameters = (id) =>
  useParameterMutation(id, (values) => billService.saveParameters(id, values));

export const useSubmitParameters = (id) =>
  useParameterMutation(id, (values) => billService.submitParameters(id, values));

export const useDeleteBill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: billService.deleteBill,
    onSuccess: (_data, id) => {
      // Gone for good — refetching it would only 404.
      queryClient.removeQueries({ queryKey: billKeys.detail(id) });
      refreshLists(queryClient);
    },
  });
};
