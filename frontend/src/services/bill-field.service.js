import { http } from '../api/http.js';
import { ENDPOINTS } from '../api/endpoints.js';

// Service layer: one function per API operation. No React, no caching.

/** `{ groups, fields }` — every section and field of the parameter form, archived included. */
export const listDefinitions = () => http(ENDPOINTS.billFields.list());

export const createField = (values) => http(ENDPOINTS.billFields.create(), { method: 'POST', body: values });

export const updateField = (id, changes) =>
  http(ENDPOINTS.billFields.update(id), { method: 'PATCH', body: changes });

export const deleteField = (id) => http(ENDPOINTS.billFields.remove(id), { method: 'DELETE' });

/** Resolves to the whole form again, in its new order. */
export const moveField = (id, direction) =>
  http(ENDPOINTS.billFields.move(id), { method: 'POST', body: { direction } });

export const createGroup = (values) => http(ENDPOINTS.billFields.createGroup(), { method: 'POST', body: values });

export const updateGroup = (id, changes) =>
  http(ENDPOINTS.billFields.updateGroup(id), { method: 'PATCH', body: changes });

export const deleteGroup = (id) => http(ENDPOINTS.billFields.removeGroup(id), { method: 'DELETE' });

export const moveGroup = (id, direction) =>
  http(ENDPOINTS.billFields.moveGroup(id), { method: 'POST', body: { direction } });
