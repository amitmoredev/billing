import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';
import { fail } from '../utils/api-response.js';

export const notFoundHandler = (req, res) =>
  fail(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);

// eslint-disable-next-line no-unused-vars -- Express needs the 4-arg signature.
export const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) return fail(res, err.statusCode, err.message, err.details);

  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return fail(res, 400, 'Validation failed', details);
  }

  console.error('[error]', err);
  return fail(res, 500, env.nodeEnv === 'production' ? 'Internal server error' : err.message);
};
