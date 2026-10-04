import { http } from '../api/http.js';
import { ENDPOINTS } from '../api/endpoints.js';

// Service layer: one function per API operation. No React, no caching.

export const listUsers = (params) => http(ENDPOINTS.users.list(), { params });

export const createUser = (values) =>
  http(ENDPOINTS.users.create(), { method: 'POST', body: values });

export const updateUser = (id, changes) =>
  http(ENDPOINTS.users.update(id), { method: 'PATCH', body: changes });

export const deleteUser = (id) => http(ENDPOINTS.users.remove(id), { method: 'DELETE' });
