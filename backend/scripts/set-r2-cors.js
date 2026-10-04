/**
 * Applies the bucket CORS policy R2 needs for browser-side uploads.
 *
 * The browser PUTs file bytes straight to R2 using a presigned URL, so R2 —
 * not this server — is the origin that must allow the request. Without this
 * policy the PUT fails preflight with a CORS error even though presigning
 * succeeded.
 *
 * Run after creating the bucket, and again whenever CORS_ORIGINS changes:
 *   npm run r2:cors
 */
import { GetBucketCorsCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import { r2Client } from '../config/r2.js';
import { env } from '../config/env.js';

const origins = env.corsOrigins.map((origin) => origin.trim()).filter(Boolean);

const rules = [
  {
    AllowedOrigins: origins,
    AllowedMethods: ['GET', 'PUT', 'HEAD'],
    // Presigned PUTs send Content-Type; the SDK may also sign checksum headers.
    AllowedHeaders: ['*'],
    ExposeHeaders: ['ETag', 'Content-Length', 'Content-Type'],
    MaxAgeSeconds: 3600,
  },
];

const run = async () => {
  if (!origins.length) {
    throw new Error('CORS_ORIGINS is empty — set it in .env before running this script.');
  }

  await r2Client.send(
    new PutBucketCorsCommand({
      Bucket: env.r2.bucket,
      CORSConfiguration: { CORSRules: rules },
    })
  );

  const applied = await r2Client.send(new GetBucketCorsCommand({ Bucket: env.r2.bucket }));

  console.log(`CORS applied to bucket "${env.r2.bucket}":`);
  console.log(JSON.stringify(applied.CORSRules, null, 2));
};

run().catch((error) => {
  console.error('Failed to set R2 CORS:', error.message);
  process.exitCode = 1;
});
