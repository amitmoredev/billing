import { http, putToStorage } from '../api/http.js';
import { ENDPOINTS } from '../api/endpoints.js';

// Service layer: one function per API operation. No React, no caching.

export const listBills = (params) => http(ENDPOINTS.bills.list(), { params });

export const getBill = (id) => http(ENDPOINTS.bills.detail(id));

export const getStats = () => http(ENDPOINTS.bills.stats());

export const saveParameters = (id, parameters) =>
  http(ENDPOINTS.bills.saveParameters(id), { method: 'PATCH', body: parameters });

export const submitParameters = (id, parameters) =>
  http(ENDPOINTS.bills.submitParameters(id), { method: 'POST', body: parameters });

export const deleteBill = (id) => http(ENDPOINTS.bills.remove(id), { method: 'DELETE' });

/** Three-step upload: reserve row, PUT bytes to R2, confirm. */
export const uploadBill = async (file, onProgress) => {
  const intent = await http(ENDPOINTS.bills.presignUpload(), {
    method: 'POST',
    body: { fileName: file.name, mimeType: file.type, size: file.size },
  });

  await putToStorage(intent.uploadUrl, file, onProgress);

  return http(ENDPOINTS.bills.confirmUpload(intent.billId), { method: 'POST' });
};
