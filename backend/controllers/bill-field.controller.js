import * as billFieldService from '../services/bill-field.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { ok } from '../utils/api-response.js';

// Controller layer: read validated input, call the service, shape the response.

export const listDefinitions = asyncHandler(async (_req, res) => {
  ok(res, await billFieldService.listDefinitions());
});

export const createField = asyncHandler(async (req, res) => {
  ok(res, await billFieldService.createField(req.validated.body, req.user), 201);
});

export const updateField = asyncHandler(async (req, res) => {
  ok(res, await billFieldService.updateField(req.validated.params.id, req.validated.body));
});

export const deleteField = asyncHandler(async (req, res) => {
  ok(res, await billFieldService.deleteField(req.validated.params.id));
});

export const moveField = asyncHandler(async (req, res) => {
  ok(res, await billFieldService.moveField(req.validated.params.id, req.validated.body.direction));
});

export const createGroup = asyncHandler(async (req, res) => {
  ok(res, await billFieldService.createGroup(req.validated.body), 201);
});

export const updateGroup = asyncHandler(async (req, res) => {
  ok(res, await billFieldService.updateGroup(req.validated.params.id, req.validated.body));
});

export const deleteGroup = asyncHandler(async (req, res) => {
  ok(res, await billFieldService.deleteGroup(req.validated.params.id));
});

export const moveGroup = asyncHandler(async (req, res) => {
  ok(res, await billFieldService.moveGroup(req.validated.params.id, req.validated.body.direction));
});
