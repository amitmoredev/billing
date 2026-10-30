import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as siteService from '../services/site.service.js';
import { billKeys } from './bill.query.js';

// Cache keys for this resource. Invalidation never guesses at a shape.
export const siteKeys = {
  all: ['sites'],
};

/**
 * Every site, A–Z, each with `bills: { total, pending, verified }`. Small
 * enough to load whole and filter in the browser.
 */
export const useSites = () =>
  useQuery({
    queryKey: siteKeys.all,
    queryFn: siteService.listSites,
    select: (data) => data.items,
  });

/** `{ total, pending, verified }` for bills not under any site — same request as useSites. */
export const useUnassignedBills = () =>
  useQuery({
    queryKey: siteKeys.all,
    queryFn: siteService.listSites,
    select: (data) => data.unassigned,
  });

// Bills show their site's name, so a change refetches them too — in the
// background. Returning the promise would hold the mutation (and its spinner)
// pending until the refetch finished.
const useSiteMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: siteKeys.all });
      queryClient.invalidateQueries({ queryKey: billKeys.all });
    },
  });
};

export const useCreateSite = () => useSiteMutation(siteService.createSite);

export const useUpdateSite = () =>
  useSiteMutation(({ id, ...changes }) => siteService.updateSite(id, changes));

export const useDeleteSite = () => useSiteMutation(siteService.deleteSite);
