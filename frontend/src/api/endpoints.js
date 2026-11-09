// Single place every API path is declared. Nothing else builds URLs.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const ENDPOINTS = {
  auth: {
    sendOtp: () => '/auth/send-otp',
    verifyOtp: () => '/auth/verify-otp',
    me: () => '/auth/me',
    logout: () => '/auth/logout',
  },

  bills: {
    list: () => '/bills',
    stats: () => '/bills/stats',
    detail: (id) => `/bills/${id}`,
    remove: (id) => `/bills/${id}`,
    presignUpload: () => '/bills/uploads/presign',
    confirmUpload: (id) => `/bills/${id}/uploads/confirm`,
    saveParameters: (id) => `/bills/${id}/parameters`,
    submitParameters: (id) => `/bills/${id}/parameters/submit`,
    export: () => '/bills/export',
    months: () => '/bills/months',
  },

  sites: {
    list: () => '/sites',
    create: () => '/sites',
    update: (id) => `/sites/${id}`,
    remove: (id) => `/sites/${id}`,
  },

  analytics: {
    overview: () => '/analytics',
  },

  users: {
    list: () => '/admin/users',
    create: () => '/admin/users',
    update: (id) => `/admin/users/${id}`,
    remove: (id) => `/admin/users/${id}`,
  },
};
