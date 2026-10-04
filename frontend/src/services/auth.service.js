import { http } from '../api/http.js';
import { ENDPOINTS } from '../api/endpoints.js';

// `scope` is set only by the admin sign-in screen; omitted, it drops out of the JSON.

export const sendOtp = ({ phone, scope }) =>
  http(ENDPOINTS.auth.sendOtp(), { method: 'POST', body: { phone, scope } });

export const verifyOtp = ({ phone, otp, scope }) =>
  http(ENDPOINTS.auth.verifyOtp(), { method: 'POST', body: { phone, otp, scope } });

export const getMe = () => http(ENDPOINTS.auth.me());

export const logout = () => http(ENDPOINTS.auth.logout(), { method: 'POST' });
