import { Router } from "express";
import { z } from "zod";
import { generateTaskPlan } from "../services/aiPlanner.js";
import { createTask, appendLogs, getAllTasks, getTaskById } from "../repositories/taskRepository.js";
import { executeTaskAsync } from "../services/executionEngine.js";

const createTaskSchema = z.object({
  input: z.string().min(3, "Task input must be at least 3 characters"),
});

export const taskRoutes = Router();

taskRoutes.post("/task", async (req, res, next) => {
  try {
    const parsed = createTaskSchema.parse(req.body);
    const plan = await generateTaskPlan(parsed.input);
    const task = await createTask(parsed.input, plan);

    await appendLogs(task.id, ["✔ Task accepted", "⚙ Planning workflow..."]);
    executeTaskAsync(task.id, plan);

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

taskRoutes.get("/tasks", async (_req, res, next) => {
  try {
    const tasks = await getAllTasks();
    res.json({ tasks });
  } catch (error) {
    next(error);
  }
});
