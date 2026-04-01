import { Router } from "express";
import { z } from "zod";
import { generateTaskPlan } from "../services/aiPlanner.js";
import {
  createTask,
  appendLogs,
  getAllTasks,
  getTaskById,
  getTaskMetrics,
  requeueTask,
} from "../repositories/taskRepository.js";
import { enqueueTaskExecution } from "../services/executionEngine.js";

const createTaskSchema = z.object({
  input: z.string().min(3, "Task input must be at least 3 characters"),
});

export const taskRoutes = Router();

taskRoutes.post("/task", async (req, res, next) => {
  try {
    const parsed = createTaskSchema.parse(req.body);
    const plan = await generateTaskPlan(parsed.input);
    const task = await createTask(parsed.input, plan);

    await appendLogs(task.id, ["✔ Task accepted", "⚙ Planning workflow...", "⏳ Queued for execution"]);
    enqueueTaskExecution(task.id, plan);

    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
});

taskRoutes.get("/task/:id", async (req, res, next) => {
  try {
    const taskId = Number(req.params.id);

    if (Number.isNaN(taskId) || taskId <= 0) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    const result = await getTaskById(taskId);

    if (!result) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

taskRoutes.get("/task/:id/stream", async (req, res, next) => {
  try {
    const taskId = Number(req.params.id);

    if (Number.isNaN(taskId) || taskId <= 0) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let previousStatus: string | null = null;
    let previousLogCount = 0;

    const writeSnapshot = async () => {
      const result = await getTaskById(taskId);

      if (!result) {
        res.write(`event: error\ndata: ${JSON.stringify({ message: "Task not found" })}\n\n`);
        return;
      }

      const statusChanged = result.task.status !== previousStatus;
      const logsChanged = result.logs.length !== previousLogCount;

      if (statusChanged || logsChanged) {
        res.write(`data: ${JSON.stringify(result)}\n\n`);
        previousStatus = result.task.status;
        previousLogCount = result.logs.length;
      }
    };

    const pingInterval = setInterval(() => {
      res.write(": ping\n\n");
    }, 15000);

    const streamInterval = setInterval(() => {
      writeSnapshot().catch(() => {
        res.write(`event: error\ndata: ${JSON.stringify({ message: "Stream update failed" })}\n\n`);
      });
    }, 1000);

    await writeSnapshot();

    req.on("close", () => {
      clearInterval(streamInterval);
      clearInterval(pingInterval);
      res.end();
    });

    return;
  } catch (error) {
    return next(error);
  }
});

taskRoutes.get("/tasks", async (_req, res, next) => {
  try {
    const tasks = await getAllTasks();
    res.json({ tasks });
  } catch (error) {
    next(error);
  }
});

taskRoutes.get("/metrics", async (_req, res, next) => {
  try {
    const metrics = await getTaskMetrics();
    res.json({ metrics });
  } catch (error) {
    next(error);
  }
});

taskRoutes.post("/task/:id/retry", async (req, res, next) => {
  try {
    const taskId = Number(req.params.id);

    if (Number.isNaN(taskId) || taskId <= 0) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    const result = await getTaskById(taskId);
    if (!result) {
      return res.status(404).json({ message: "Task not found" });
    }

    const task = await requeueTask(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await appendLogs(taskId, ["↻ Manual retry requested", "⏳ Re-queued for execution"]);
    enqueueTaskExecution(taskId, task.plan);

    return res.json({ task });
  } catch (error) {
    return next(error);
  }
});
