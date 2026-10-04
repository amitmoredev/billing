import { API_BASE_URL } from './endpoints.js';

export class ApiError extends Error {
  constructor(message, { status, details } = {}) {
    super(message);
    this.status = status;
    this.details = details || [];
  }

  /** { field: message } — feeds inline form errors. */
  get fieldErrors() {
    return Object.fromEntries(this.details.map((d) => [d.field, d.message]));
  }
}

/** Talks to our API and unwraps the { success, data } envelope. */
export const http = async (path, { method = 'GET', body, params } = {}) => {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  });

  const res = await fetch(url, {
    method,
    credentials: 'include', // the session is an httpOnly cookie
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload?.success) {
    throw new ApiError(payload?.error?.message || `Request failed (${res.status})`, {
      status: res.status,
      details: payload?.error?.details,
    });
  }
  return payload.data;
};

/** Direct PUT to R2. XHR instead of fetch because we need upload progress. */
export const putToStorage = (uploadUrl, file, onProgress) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new ApiError(`Storage upload failed (${xhr.status})`, { status: xhr.status }));
    xhr.onerror = () => reject(new ApiError('Network error during upload'));
    xhr.send(file);
  });
