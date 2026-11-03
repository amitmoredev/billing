import * as analyticsService from '../services/analytics.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { ok } from '../utils/api-response.js';

// Controller layer: read validated input, call the service, shape the response.

export const getOverview = asyncHandler(async (req, res) => {
  ok(res, await analyticsService.getOverview(req.validated.query));
});
