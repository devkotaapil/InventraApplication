const authBuckets = new Map();

function clientKey(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]?.trim();
  return ip || req.socket.remoteAddress || "unknown";
}

export function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:5000 http://127.0.0.1:5000 https:; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none';");

  if (req.secure || req.headers["x-forwarded-proto"] === "https") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  next();
}

export function authRateLimit(req, res, next) {
  const key = `${clientKey(req)}:${req.path}`;
  const now = Date.now();
  const windowMs = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
  const maxAttempts = Number(process.env.AUTH_RATE_LIMIT_MAX || (process.env.NODE_ENV === "production" ? 20 : 1000));
  const entry = authBuckets.get(key);

  if (!entry || now > entry.resetAt) {
    authBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }

  if (entry.count >= maxAttempts) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.setHeader("Retry-After", String(retryAfter));
    return res.status(429).json({
      success: false,
      data: null,
      message: "Too many authentication attempts. Please try again later."
    });
  }

  entry.count += 1;
  next();
}

export function clearAuthRateLimit(req) {
  authBuckets.delete(`${clientKey(req)}:${req.path}`);
}
