import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import * as userData from '../data/user.data.js';
import { SIGN_IN_SCOPES, can, rulesFor } from '../policies/permissions.js';
import { ApiError } from '../utils/api-error.js';
import { consumeOtp, issueOtp } from './otp.service.js';

const NOT_REGISTERED =
  "You're not allowed to sign in with this number. Please contact your administrator.";
const DISABLED = 'This account has been disabled. Please contact your administrator.';
const SESSION_EXPIRED = 'Your session has expired. Please sign in again.';

export const SESSION_MS = env.auth.sessionDays * 24 * 60 * 60 * 1000;

const signSessionToken = (user) =>
  jwt.sign({ phone: user.phone }, env.auth.jwtSecret, {
    subject: String(user._id),
    expiresIn: `${env.auth.sessionDays}d`,
  });

/** What the browser gets after sign-in and from /me: the account plus what it may do. */
export const toSession = (user) => ({ user: user.toJSON(), permissions: rulesFor(user) });

/**
 * Sign-up is closed: the number must belong to an account an admin created,
 * and that account must be active. A scope (e.g. "admin") adds the permission
 * that screen needs, checked here so the wrong account never gets a code.
 */
const findSignInAccount = async (phone10, scope) => {
  const user = await userData.findByPhone(phone10);

  if (scope && !can(user, ...SIGN_IN_SCOPES[scope])) {
    throw ApiError.forbidden(`This number does not have ${scope} access.`);
  }
  if (!user) throw ApiError.forbidden(NOT_REGISTERED);
  if (!user.isActive) throw ApiError.forbidden(DISABLED);

  return user;
};

/** Step 1 — unknown numbers are turned away before a WhatsApp message is spent. */
export const requestLoginOtp = async (phone10, scope) => {
  await findSignInAccount(phone10, scope);
  const { otp } = await issueOtp(phone10);

  return {
    message: 'Code sent on WhatsApp',
    resendAfterSeconds: env.otp.resendCooldownSeconds,
    expiresInSeconds: env.otp.ttlSeconds,
    ...(env.otp.debugReturnOtp ? { debugOtp: otp } : {}),
  };
};

/**
 * Step 2 — the account is checked again (an admin may have removed it since
 * the code went out), and before the code is burned, so a refusal costs nothing.
 */
export const verifyLoginOtp = async (phone10, otp, scope) => {
  const account = await findSignInAccount(phone10, scope);
  await consumeOtp(phone10, otp);

  const user = await userData.markSignedIn(account._id);
  return { session: toSession(user), token: signSessionToken(user) };
};

/**
 * Token -> live account. Re-read on every request so disabling or deleting an
 * account locks it out at once, not when its token expires.
 */
export const resolveSession = async (token) => {
  let payload;
  try {
    payload = jwt.verify(token, env.auth.jwtSecret);
  } catch {
    throw ApiError.unauthorized(SESSION_EXPIRED);
  }

  const user = await userData.findById(payload.sub);
  if (!user?.isActive) throw ApiError.unauthorized();
  return user;
};
