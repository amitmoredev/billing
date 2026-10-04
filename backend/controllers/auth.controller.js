import * as authService from '../services/auth.service.js';
import { clearAuthCookie, setAuthCookie } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { ok } from '../utils/api-response.js';

export const sendOtp = asyncHandler(async (req, res) => {
  const { phone, scope } = req.validated.body;
  ok(res, await authService.requestLoginOtp(phone, scope));
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { phone, otp, scope } = req.validated.body;
  const { session, token } = await authService.verifyLoginOtp(phone, otp, scope);

  setAuthCookie(res, token, authService.SESSION_MS);
  ok(res, session);
});

export const me = (req, res) => ok(res, authService.toSession(req.user));

export const logout = (_req, res) => {
  clearAuthCookie(res);
  ok(res, { message: 'Signed out' });
};
