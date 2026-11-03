import { useQuery } from '@tanstack/react-query';
import * as analyticsService from '../services/analytics.service.js';

// Cache keys for this resource. Invalidation never guesses at a shape.
export const analyticsKeys = {
  all: ['analytics'],
  overview: (params) => ['analytics', 'overview', params],
};

/** Everything the Analysis page shows. Keeps the last result on screen while filters change. */
export const useAnalytics = (params) =>
  useQuery({
    queryKey: analyticsKeys.overview(params),
    queryFn: () => analyticsService.getOverview(params),
    placeholderData: (prev) => prev,
  });
