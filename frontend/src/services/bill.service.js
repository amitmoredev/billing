import { download, http, putToStorage } from '../api/http.js';
import { ENDPOINTS } from '../api/endpoints.js';

// Service layer: one function per API operation. No React, no caching.

export const listBills = (params) => http(ENDPOINTS.bills.list(), { params });

export const getBill = (id) => http(ENDPOINTS.bills.detail(id));

export const getStats = (params) => http(ENDPOINTS.bills.stats(), { params });

/** `values` is the parameters plus `site` (an id, or '' for none). */
export const saveParameters = (id, values) =>
  http(ENDPOINTS.bills.saveParameters(id), { method: 'PATCH', body: values });

export const submitParameters = (id, values) =>
  http(ENDPOINTS.bills.submitParameters(id), { method: 'POST', body: values });

export const deleteBill = (id) => http(ENDPOINTS.bills.remove(id), { method: 'DELETE' });

/** Three-step upload: reserve row, PUT bytes to R2, confirm. `siteId` files it under a site. */
export const uploadBill = async (file, { onProgress, siteId } = {}) => {
  const intent = await http(ENDPOINTS.bills.presignUpload(), {
    method: 'POST',
    body: { fileName: file.name, mimeType: file.type, size: file.size, siteId },
  });

  await putToStorage(intent.uploadUrl, file, onProgress);

  return http(ENDPOINTS.bills.confirmUpload(intent.billId), { method: 'POST' });
};

/** Downloads verified bills as Excel, in the client's workbook layout. Resolves to the file name. */
export const exportBills = (params) =>
  download(ENDPOINTS.bills.export(), { params, fallbackName: 'Bill data.xlsx' });

/** Bill months that have verified bills, oldest first. */
export const listMonths = (params) => http(ENDPOINTS.bills.months(), { params });
