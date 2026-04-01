import express from "express";
import cors from "cors";
import { ZodError } from "zod";
import { taskRoutes } from "./routes/taskRoutes.js";

export const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", taskRoutes);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      issues: error.issues,
    });
  }

  return res.status(500).json({
    message: "Internal server error",
  });
});
