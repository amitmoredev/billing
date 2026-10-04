import { ApiError } from '../utils/api-error.js';

// Parses req[source] with a zod schema and replaces it with the typed result.
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return next(ApiError.badRequest('Validation failed', details));
  }
  req.validated = { ...req.validated, [source]: result.data };
  next();
};
