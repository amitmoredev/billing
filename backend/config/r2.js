import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env.js';

// R2 speaks the S3 API; region must be literally "auto".
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.r2.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.r2.accessKeyId,
    secretAccessKey: env.r2.secretAccessKey,
  },
  // The SDK otherwise signs x-amz-checksum-* headers into presigned PUT URLs.
  // A browser never sends those, so the upload would fail signature validation.
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});
