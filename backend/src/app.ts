import express from "express";
import cors from "cors";
import { ZodError } from "zod";
import { taskRoutes } from "./routes/taskRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import { pool } from "./db/pool.js";
import { createRateLimiter } from "./middleware/rateLimit.js";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { requestLoggerMiddleware } from "./middleware/requestLogger.js";

export const app = express();
const apiRateLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 120,
});

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, status: "healthy" });
});

app.get("/readyz", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, status: "ready", database: "connected" });
  } catch {
    res.status(503).json({ ok: false, status: "not_ready", database: "disconnected" });
  }
});

app.use("/api", apiRateLimiter);
app.use("/api", taskRoutes);
app.use("/api", aiRoutes);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const requestId = String(res.locals.requestId ?? "unknown");

  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      issues: error.issues,
      requestId,
    });
  }

  return res.status(500).json({
    message: "Internal server error",
    requestId,
  });
});
