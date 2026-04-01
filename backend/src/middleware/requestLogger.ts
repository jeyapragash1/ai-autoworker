import type { NextFunction, Request, Response } from "express";

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const requestId = String(res.locals.requestId ?? "unknown");

    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        level: "info",
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
      }),
    );
  });

  next();
}
