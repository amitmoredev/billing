import * as billService from '../services/bill.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { ok } from '../utils/api-response.js';

// Controller layer: read validated input, call the service, shape the response.

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

export const assignSite = asyncHandler(async (req, res) => {
  ok(res, await billService.assignSite(req.validated.body));
});

export const deleteBill = asyncHandler(async (req, res) => {
  const data = await billService.deleteBill(req.validated.params.id);
  ok(res, data);
});

export const getStats = asyncHandler(async (req, res) => {
  ok(res, await billService.getStats(req.validated.query));
});
