/**
 * Centralized error handler — must be registered as the LAST middleware.
 *
 * Expects errors to optionally carry:
 *   err.statusCode  – HTTP status (defaults to 500)
 *   err.message     – Human-readable message
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const isDev = process.env.NODE_ENV !== "production";

  const statusCode = typeof err.statusCode === "number" ? err.statusCode : 500;

  const body = {
    message: err.message || "Internal Server Error",
    ...(isDev && err.stack ? { stack: err.stack } : {}),
  };

  // Log server-side errors in dev so the console is useful
  if (statusCode >= 500) {
    console.error("[errorHandler]", err);
  }

  res.status(statusCode).json(body);
}

module.exports = errorHandler;
