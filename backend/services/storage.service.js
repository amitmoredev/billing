import { randomUUID } from 'node:crypto';
import path from 'node:path';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client } from '../config/r2.js';
import { env } from '../config/env.js';

const { bucket, publicBaseUrl } = env.r2;

// Keys are date-partitioned so a bucket listing stays navigable at scale.
export const buildObjectKey = (originalName) => {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const ext = path.extname(originalName).toLowerCase() || '';
  return `bills/${yyyy}/${mm}/${randomUUID()}${ext}`;
};

// Browser PUTs the file straight to R2 — bytes never touch this server.
export const createUploadUrl = ({ key, mimeType }) =>
  getSignedUrl(
    r2Client,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: mimeType }),
    { expiresIn: env.upload.presignExpirySeconds }
  );

export const createViewUrl = (key, { download = false, fileName } = {}) => {
  if (publicBaseUrl) return `${publicBaseUrl.replace(/\/$/, '')}/${key}`;
  return getSignedUrl(
    r2Client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ...(download && fileName
        ? { ResponseContentDisposition: `attachment; filename="${fileName}"` }
        : {}),
    }),
    { expiresIn: env.upload.viewExpirySeconds }
  );
};

// Confirms the client actually finished the PUT; returns null when absent.
export const headObject = async (key) => {
  try {
    const res = await r2Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return { size: res.ContentLength, mimeType: res.ContentType };
  } catch (err) {
    if (err.$metadata?.httpStatusCode === 404 || err.name === 'NotFound') return null;
    throw err;
  }
};

export const deleteObject = (key) =>
  r2Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));

export const bucketName = bucket;
