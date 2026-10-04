// Single response envelope so the client parses one shape everywhere.
export const ok = (res, data, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

export const fail = (res, statusCode, message, details = null) =>
  res.status(statusCode).json({ success: false, error: { message, details } });
