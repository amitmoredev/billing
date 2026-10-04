import * as userService from '../services/user.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { ok } from '../utils/api-response.js';

// Controller layer: read validated input, call the service, shape the response.

export const listUsers = asyncHandler(async (req, res) => {
  ok(res, await userService.listUsers(req.validated.query));
});

export const createUser = asyncHandler(async (req, res) => {
  ok(res, await userService.createUser(req.validated.body), 201);
});

export const updateUser = asyncHandler(async (req, res) => {
  ok(res, await userService.updateUser(req.validated.params.id, req.validated.body));
});

export const deleteUser = asyncHandler(async (req, res) => {
  ok(res, await userService.deleteUser(req.validated.params.id));
});
