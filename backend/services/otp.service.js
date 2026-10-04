import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { OtpSession } from '../models/otp-session.model.js';
import { ApiError } from '../utils/api-error.js';
import { toMsg91Number } from '../utils/phone.js';
import { isMsg91Configured, sendWhatsAppOtp } from './msg91.service.js';

// Salted so the stored hash is useless without OTP_SECRET, and bound to the
// phone so a hash cannot be replayed against a different number.
const hashOtp = (phone10, otp) =>
  crypto.createHash('sha256').update(`${env.otp.secret}:${phone10}:${otp}`).digest('hex');

const generateOtp = () => String(crypto.randomInt(100000, 1000000));

/**
 * Issues a code over WhatsApp and stores its hash, replacing any live code for
 * this number. Rate-limited per phone by OTP_RESEND_COOLDOWN_SECONDS.
 */
export const issueOtp = async (phone10) => {
  const now = new Date();
  const existing = await OtpSession.findOne({ phone: phone10 }).select('lastSentAt').lean();

  if (existing?.lastSentAt) {
    const elapsed = Math.floor((now - existing.lastSentAt) / 1000);
    const remaining = env.otp.resendCooldownSeconds - elapsed;
    if (remaining > 0) {
      throw ApiError.tooManyRequests(`Please wait ${remaining}s before asking for another code`);
    }
  }

  const otp = generateOtp();

  // Send before storing: if WhatsApp fails, the previous code stays valid and
  // the cooldown clock is not reset.
  const skipSend = env.otp.debugReturnOtp && !isMsg91Configured();
  if (skipSend) console.warn('[otp] MSG91 not configured — code returned in response instead');
  else await sendWhatsAppOtp({ to: toMsg91Number(phone10), otp });

  await OtpSession.findOneAndUpdate(
    { phone: phone10 },
    {
      otpHash: hashOtp(phone10, otp),
      expiresAt: new Date(now.getTime() + env.otp.ttlSeconds * 1000),
      attempts: 0,
      lastSentAt: now,
    },
    { upsert: true, setDefaultsOnInsert: true }
  );

  return { otp };
};

/** Consumes the code: a correct one is single-use, a wrong one burns an attempt. */
export const consumeOtp = async (phone10, otp) => {
  const session = await OtpSession.findOne({ phone: phone10 });
  if (!session) throw ApiError.badRequest('That code has expired. Please request a new one.');

  if (session.expiresAt <= new Date()) {
    await session.deleteOne();
    throw ApiError.badRequest('That code has expired. Please request a new one.');
  }

  if (session.attempts >= env.otp.maxAttempts) {
    await session.deleteOne();
    throw ApiError.tooManyRequests('Too many wrong attempts. Please request a new code.');
  }

  if (hashOtp(phone10, otp) !== session.otpHash) {
    session.attempts += 1;
    await session.save();
    const left = env.otp.maxAttempts - session.attempts;
    throw ApiError.badRequest(`Incorrect code. ${left} ${left === 1 ? 'try' : 'tries'} left.`);
  }

  await session.deleteOne();
};
