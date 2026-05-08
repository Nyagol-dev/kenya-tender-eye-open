/**
 * Simple in-memory rate limiter (no external dependencies).
 *
 * Tracks requests by IP + route key.  Uses a Map that is shared for the
 * lifetime of the process; entries are pruned lazily to avoid unbounded growth.
 *
 * Default: 5 requests per 15 minutes per IP+route combination.
 */

/** @type {Map<string, { count: number; resetAt: number }>} */
const store = new Map();

/**
 * Remove entries that have already expired to keep the Map lean.
 * Called before every lookup — O(n) but fast for typical auth traffic.
 */
function pruneExpired() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  }
}

/**
 * Creates a rate-limiting middleware.
 *
 * @param {object} [options]
 * @param {number} [options.max=5]            – max requests allowed per window
 * @param {number} [options.windowMs=900000]  – window length in milliseconds (default 15 min)
 * @returns {import('express').RequestHandler}
 */
function rateLimit({ max = 5, windowMs = 15 * 60 * 1000 } = {}) {
  return function rateLimitMiddleware(req, res, next) {
    pruneExpired();

    // Prefer X-Forwarded-For when behind a proxy (e.g. nginx), fall back to socket IP
    const ip =
      (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
      req.socket.remoteAddress ||
      "unknown";

    const route = req.path; // e.g. "/signup", "/login"
    const key = `${ip}::${route}`;

    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now >= entry.resetAt) {
      // First request in this window (or window has expired)
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= max) {
      const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
      res.set("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({
        message: `Too many requests. Please try again in ${retryAfterSeconds} seconds.`,
      });
    }

    entry.count += 1;
    next();
  };
}

module.exports = rateLimit;
