import { http } from '../api/http.js';
import { ENDPOINTS } from '../api/endpoints.js';

// Service layer: one function per API operation. No React, no caching.

/** Filters (site, discom, from, to) plus any assumptions the viewer changed. */
export const getOverview = (params) => http(ENDPOINTS.analytics.overview(), { params });
