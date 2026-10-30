import { http } from '../api/http.js';
import { ENDPOINTS } from '../api/endpoints.js';

// Service layer: one function per API operation. No React, no caching.

export const listSites = () => http(ENDPOINTS.sites.list());

export const createSite = (values) =>
  http(ENDPOINTS.sites.create(), { method: 'POST', body: values });

export const updateSite = (id, changes) =>
  http(ENDPOINTS.sites.update(id), { method: 'PATCH', body: changes });

export const deleteSite = (id) => http(ENDPOINTS.sites.remove(id), { method: 'DELETE' });
