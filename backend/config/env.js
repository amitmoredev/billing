import 'dotenv/config';

// Fail fast on missing config instead of at first request.
const required = (key) => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),

  mongoUri: required('MONGO_URI'),

  auth: {
    jwtSecret: required('JWT_SECRET'),
    cookieName: process.env.AUTH_COOKIE_NAME || 'billing_token',
    sessionDays: Number(process.env.AUTH_SESSION_DAYS || 7),
  },

  otp: {
    secret: required('OTP_SECRET'),
    ttlSeconds: Number(process.env.OTP_TTL_SECONDS || 300),
    resendCooldownSeconds: Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 30),
    maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS || 5),
    // Dev escape hatch: returns the code in the response instead of needing WhatsApp.
    debugReturnOtp: process.env.OTP_DEBUG_RETURN_OTP === 'true',
  },

  // Optional at boot — checked when an OTP is actually sent, so local dev can
  // run on OTP_DEBUG_RETURN_OTP without MSG91 credentials.
  msg91: {
    authKey: process.env.MSG91_AUTH_KEY || '',
    integratedNumber: process.env.MSG91_INTEGRATED_NUMBER || '',
    templateName: process.env.MSG91_TEMPLATE_NAME || '',
    templateNamespace: process.env.MSG91_TEMPLATE_NAMESPACE || '',
    languageCode: process.env.MSG91_TEMPLATE_LANGUAGE_CODE || 'en',
    languagePolicy: process.env.MSG91_TEMPLATE_LANGUAGE_POLICY || 'deterministic',
    buttonValue: (process.env.MSG91_TEMPLATE_BUTTON_VALUE || '').trim(),
  },

  r2: {
    accountId: required('R2_ACCOUNT_ID'),
    accessKeyId: required('R2_ACCESS_KEY_ID'),
    secretAccessKey: required('R2_SECRET_ACCESS_KEY'),
    bucket: required('R2_BUCKET'),
    // Optional public domain; when set, view URLs skip presigning.
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL || '',
  },

  upload: {
    maxBytes: Number(process.env.UPLOAD_MAX_BYTES || 20 * 1024 * 1024), // 20 MB
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    presignExpirySeconds: 300,
    viewExpirySeconds: 3600,
  },
};
