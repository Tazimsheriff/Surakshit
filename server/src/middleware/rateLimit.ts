import rateLimit from "express-rate-limit";

export function createAnalyzeLimiter(limit: number) {
  return rateLimit({
    windowMs: 60_000,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ ok: false, error: { code: "rate_limited" } });
    },
  });
}
