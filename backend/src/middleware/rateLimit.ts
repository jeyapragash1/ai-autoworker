import type { NextFunction, Request, Response } from "express";

type RateLimitOptions = {
  windowMs: number;
  max: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, max } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.ip ?? "unknown"}:${req.path}`;
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || existing.resetAt < now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (existing.count >= max) {
      res.status(429).json({
        message: "Rate limit exceeded",
        retryAfterMs: Math.max(0, existing.resetAt - now),
      });
      return;
    }

    existing.count += 1;
    buckets.set(key, existing);
    next();
  };
}
