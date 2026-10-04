import { env } from '../config/env.js';
import { can } from '../policies/permissions.js';
import { resolveSession } from '../services/auth.service.js';
import { ApiError } from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';

// Cross-site in production (API and app on different domains), so the cookie
// needs SameSite=None, which browsers only accept alongside Secure.
const cookieOptions = () => {
  const isProd = env.nodeEnv === 'production';
  return {
    httpOnly: true, // no script on the page can read the session
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    path: '/',
  };
};

export const setAuthCookie = (res, token, maxAgeMs) =>
  res.cookie(env.auth.cookieName, token, { ...cookieOptions(), maxAge: maxAgeMs });

export const clearAuthCookie = (res) => res.clearCookie(env.auth.cookieName, cookieOptions());

// Cookie first; the Bearer header is there for API clients and curl.
const readToken = (req) => {
  const fromCookie = req.cookies?.[env.auth.cookieName];
  if (fromCookie) return fromCookie;

  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null;
};

/** Gate for everything behind sign-in. Sets req.user to the live account document. */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = readToken(req);
  if (!token) throw ApiError.unauthorized();

  req.user = await resolveSession(token);
  next();
});

/** Runs after requireAuth. Every permission check in the API goes through here. */
export const authorize = (action, subject) => (req, _res, next) =>
  can(req.user, action, subject)
    ? next()
    : next(ApiError.forbidden("You don't have permission to do this."));
