import * as billData from '../data/bill.data.js';
import * as storage from './storage.service.js';
import { BILL_STATUS } from '../models/bill.model.js';
import { ApiError } from '../utils/api-error.js';
import { env } from '../config/env.js';

// Service layer: business rules + orchestration between R2 and Mongo.

const toDto = (doc) => {
  const bill = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc, id: String(doc._id) };
  delete bill._id;
  delete bill.__v;
  return bill;
};

const loadOrThrow = async (id) => {
  const bill = await billData.findById(id);
  if (!bill) throw ApiError.notFound('Bill not found');
  return bill;
};

/** Step 1 — reserve a DB row and hand back a direct-to-R2 upload URL. */
export const createUploadIntent = async ({ fileName, mimeType, size }) => {
  if (!env.upload.allowedMimeTypes.includes(mimeType)) {
    throw ApiError.badRequest(`Unsupported file type: ${mimeType}`);
  }
  if (size > env.upload.maxBytes) {
    throw ApiError.badRequest(`File exceeds ${Math.round(env.upload.maxBytes / 1024 / 1024)} MB`);
  }

  const key = storage.buildObjectKey(fileName);
  const bill = await billData.create({
    file: { key, bucket: storage.bucketName, originalName: fileName, mimeType, size },
    status: BILL_STATUS.PENDING_UPLOAD,
  });

  const uploadUrl = await storage.createUploadUrl({ key, mimeType });
  return { billId: bill.id, key, uploadUrl, expiresIn: env.upload.presignExpirySeconds };
};

/** Step 3 — verify the object landed in R2, then publish the bill. */
export const confirmUpload = async (id) => {
  const bill = await loadOrThrow(id);
  if (bill.status !== BILL_STATUS.PENDING_UPLOAD) return toDto(bill);

  const object = await storage.headObject(bill.file.key);
  if (!object) throw ApiError.badRequest('Upload not found in storage');

  bill.file.size = object.size ?? bill.file.size;
  bill.status = BILL_STATUS.UPLOADED;
  bill.uploadedAt = new Date();
  await bill.save();

  return toDto(bill);
};

export const listBills = async ({ status, search, page = 1, limit = 20 }) => {
  // Half-finished uploads are internal state; hide them unless asked for.
  const effectiveStatus = status || { $ne: BILL_STATUS.PENDING_UPLOAD };
  const { items, total } = await billData.findMany({
    status: effectiveStatus,
    search,
    page,
    limit,
  });

  return {
    items: items.map(toDto),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  };
};

/** Detail view — DTO plus a short-lived URL the viewer can render. */
export const getBill = async (id) => {
  const bill = await loadOrThrow(id);
  const fileUrl = await storage.createViewUrl(bill.file.key);
  return { ...toDto(bill), fileUrl };
};

/** Draft save: partial parameters, status untouched. */
export const saveParameters = async (id, parameters) => {
  const bill = await loadOrThrow(id);
  bill.parameters = { ...bill.parameters.toObject(), ...parameters };
  await bill.save();
  return toDto(bill);
};

/** Final save: parameters were fully validated upstream, mark submitted. */
export const submitParameters = async (id, parameters) => {
  const bill = await loadOrThrow(id);
  if (bill.status === BILL_STATUS.PENDING_UPLOAD) {
    throw ApiError.conflict('Cannot submit parameters before the file is uploaded');
  }

  bill.parameters = { ...bill.parameters.toObject(), ...parameters };
  bill.status = BILL_STATUS.SUBMITTED;
  bill.submittedAt = new Date();
  await bill.save();
  return toDto(bill);
};

/** Remove the object first — an orphaned row is easier to spot than an orphaned object. */
export const deleteBill = async (id) => {
  const bill = await loadOrThrow(id);
  await storage.deleteObject(bill.file.key);
  await billData.deleteById(id);
  return { id };
};

export const getStats = async () => {
  const rows = await billData.countByStatus();
  const stats = { total: 0, uploaded: 0, submitted: 0 };
  for (const row of rows) {
    if (row._id === BILL_STATUS.PENDING_UPLOAD) continue;
    stats.total += row.count;
    if (row._id === BILL_STATUS.UPLOADED) stats.uploaded = row.count;
    if (row._id === BILL_STATUS.SUBMITTED) stats.submitted = row.count;
  }
  return stats;
};
