import * as siteService from '../services/site.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { ok } from '../utils/api-response.js';

// Controller layer: read validated input, call the service, shape the response.

export const listSites = asyncHandler(async (_req, res) => {
  ok(res, await siteService.listSites());
});

export const createSite = asyncHandler(async (req, res) => {
  ok(res, await siteService.createSite(req.validated.body, req.user), 201);
});

export const updateSite = asyncHandler(async (req, res) => {
  ok(res, await siteService.updateSite(req.validated.params.id, req.validated.body, req.user));
});

export const deleteSite = asyncHandler(async (req, res) => {
  ok(res, await siteService.deleteSite(req.validated.params.id, req.user));
});
