import * as billService from '../services/bill.service.js';
import * as billExportService from '../services/bill-export.service.js';
import { NO_SITE } from '../validators/bill.validator.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/async-handler.js';
import { ok } from '../utils/api-response.js';

// Controller layer: read validated input, call the service, shape the response.

/** The list filter's "unassigned" value becomes the null Mongo matches on. */
const toSiteFilter = (site) => (site === NO_SITE ? null : site);

export const createUploadIntent = asyncHandler(async (req, res) => {
  const data = await billService.createUploadIntent(req.validated.body);
  ok(res, data, 201);
});

export const confirmUpload = asyncHandler(async (req, res) => {
  const bill = await billService.confirmUpload(req.validated.params.id);
  ok(res, bill);
});

export const listBills = asyncHandler(async (req, res) => {
  const data = await billService.listBills(req.validated.query);
  ok(res, data);
});

export const getBill = asyncHandler(async (req, res) => {
  const bill = await billService.getBill(req.validated.params.id);
  ok(res, bill);
});

export const saveParameters = asyncHandler(async (req, res) => {
  const bill = await billService.saveParameters(req.validated.params.id, req.validated.body);
  ok(res, bill);
});

export const submitParameters = asyncHandler(async (req, res) => {
  const bill = await billService.submitParameters(req.validated.params.id, req.validated.body);
  ok(res, bill);
});

export const deleteBill = asyncHandler(async (req, res) => {
  const data = await billService.deleteBill(req.validated.params.id);
  ok(res, data);
});

export const getStats = asyncHandler(async (req, res) => {
  ok(res, await billService.getStats(req.validated.query));
});

export const getFilterOptions = asyncHandler(async (req, res) => {
  ok(res, await billService.getFilterOptions(req.validated.query));
});

/**
 * Bill links in the file point back into the app. The address is the
 * requesting page's origin when it is one we serve, else the first we do.
 */
const appUrlFor = (req) => {
  const origin = req.get('origin');
  return env.corsOrigins.includes(origin) ? origin : env.corsOrigins[0];
};

export const exportBills = asyncHandler(async (req, res) => {
  const { site, ...range } = req.validated.query;
  const { buffer, fileName } = await billExportService.exportBills(
    { ...range, site: toSiteFilter(site) },
    { appUrl: appUrlFor(req) }
  );
  res
    .status(200)
    .set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="export.xlsx"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      'Access-Control-Expose-Headers': 'Content-Disposition',
    })
    .send(Buffer.from(buffer));
});

export const listMonths = asyncHandler(async (req, res) => {
  ok(res, await billExportService.listMonths({ site: toSiteFilter(req.validated.query.site) }));
});
