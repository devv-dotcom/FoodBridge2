const buckets = new Map();

// Use a shared-store limiter (for example Redis) when running more than one API instance.
const rateLimit = ({ windowMs = 15 * 60 * 1000, max = 10, message = 'Too many requests. Please try again later.' } = {}) => (req, res, next) => {
  const key = `${req.ip}:${req.baseUrl}${req.path}`;
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) { buckets.set(key, { count: 1, resetAt: now + windowMs }); return next(); }
  entry.count += 1;
  if (entry.count <= max) return next();
  res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
  return res.status(429).json({ success: false, message });
};

module.exports = { rateLimit };
