import * as billData from '../data/bill.data.js';
import * as storage from './storage.service.js';
import { assertExists as assertSiteExists } from './site.service.js';
import { BILL_STATUS } from '../models/bill.model.js';
import { NO_SITE } from '../validators/bill.validator.js';
import { ApiError } from '../utils/api-error.js';
import { env } from '../config/env.js';

// Service layer: business rules + orchestration between R2 and Mongo.

/** `{ id, name, code, discom }` once populated; null when the bill has no site. */
const toSiteDto = (site) => {
  if (!site) return null;
  if (site.name === undefined) return { id: String(site) }; // an id that was not populated
  return {
    id: String(site.id ?? site._id),
    name: site.name,
    code: site.code || '',
    discom: site.discom || '',
  };
};

const toDto = (doc) => {
  const bill = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...doc, id: String(doc._id) };
  delete bill._id;
  delete bill.__v;
  bill.site = toSiteDto(bill.site);
  return bill;
};

const loadOrThrow = async (id) => {
  const bill = await billData.findById(id);
  if (!bill) throw ApiError.notFound('Bill not found');
  return bill;
};

/** The list filter's "unassigned" value becomes the null Mongo matches on. */
const toSiteFilter = (site) => (site === NO_SITE ? null : site);

/** Saves the bill and returns it with its site filled in. */
const saveAndShow = async (bill) => {
  await bill.save();
  await billData.populateSite(bill);
  return toDto(bill);
};

/** `site` undefined leaves the bill's site alone; null clears it. */
const applySite = async (bill, site) => {
  if (site === undefined) return;
  if (site) await assertSiteExists(site);
  bill.site = site;
};

/** Step 1 — reserve a DB row and hand back a direct-to-R2 upload URL. */
export const createUploadIntent = async ({ fileName, mimeType, size, siteId }) => {
  if (!env.upload.allowedMimeTypes.includes(mimeType)) {
    throw ApiError.badRequest(`Unsupported file type: ${mimeType}`);
  }
  if (size > env.upload.maxBytes) {
    throw ApiError.badRequest(`File exceeds ${Math.round(env.upload.maxBytes / 1024 / 1024)} MB`);
  }
  if (siteId) await assertSiteExists(siteId, 'siteId');

  const key = storage.buildObjectKey(fileName);
  const bill = await billData.create({
    file: { key, bucket: storage.bucketName, originalName: fileName, mimeType, size },
    site: siteId ?? null,
    status: BILL_STATUS.PENDING_UPLOAD,
  });

  const uploadUrl = await storage.createUploadUrl({ key, mimeType });
  return { billId: bill.id, key, uploadUrl, expiresIn: env.upload.presignExpirySeconds };
};

/** Step 3 — verify the object landed in R2, then publish the bill. */
export const confirmUpload = async (id) => {
  const bill = await loadOrThrow(id);
  if (bill.status !== BILL_STATUS.PENDING_UPLOAD) {
    await billData.populateSite(bill);
    return toDto(bill);
  }

  const object = await storage.headObject(bill.file.key);
  if (!object) throw ApiError.badRequest('Upload not found in storage');

  bill.file.size = object.size ?? bill.file.size;
  bill.status = BILL_STATUS.UPLOADED;
  bill.uploadedAt = new Date();
  return saveAndShow(bill);
};

export const listBills = async ({ status, site, search, page = 1, limit = 20 }) => {
  // Half-finished uploads are internal state; hide them unless asked for.
  const effectiveStatus = status || { $ne: BILL_STATUS.PENDING_UPLOAD };
  const { items, total } = await billData.findMany({
    status: effectiveStatus,
    site: toSiteFilter(site),
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
  const [fileUrl] = await Promise.all([
    storage.createViewUrl(bill.file.key),
    billData.populateSite(bill),
  ]);
  return { ...toDto(bill), fileUrl };
};

/** Draft save: partial parameters and/or site, status untouched. */
export const saveParameters = async (id, { site, ...parameters }) => {
  const bill = await loadOrThrow(id);
  await applySite(bill, site);
  bill.parameters = { ...bill.parameters.toObject(), ...parameters };
  return saveAndShow(bill);
};

/** Final save: parameters and site were fully validated upstream, mark submitted. */
export const submitParameters = async (id, { site, ...parameters }) => {
  const bill = await loadOrThrow(id);
  if (bill.status === BILL_STATUS.PENDING_UPLOAD) {
    throw ApiError.conflict('Cannot submit parameters before the file is uploaded');
  }

  await applySite(bill, site);
  bill.parameters = { ...bill.parameters.toObject(), ...parameters };
  bill.status = BILL_STATUS.SUBMITTED;
  bill.submittedAt = new Date();
  return saveAndShow(bill);
};

/** Remove the object first — an orphaned row is easier to spot than an orphaned object. */
export const deleteBill = async (id) => {
  const bill = await loadOrThrow(id);
  await storage.deleteObject(bill.file.key);
  await billData.deleteById(id);
  return { id };
};

export const getStats = async ({ site } = {}) => {
  const rows = await billData.countByStatus({ site: toSiteFilter(site) });
  const stats = { total: 0, uploaded: 0, submitted: 0 };
  for (const row of rows) {
    if (row._id === BILL_STATUS.PENDING_UPLOAD) continue;
    stats.total += row.count;
    if (row._id === BILL_STATUS.UPLOADED) stats.uploaded = row.count;
    if (row._id === BILL_STATUS.SUBMITTED) stats.submitted = row.count;
  }
  return stats;
};
