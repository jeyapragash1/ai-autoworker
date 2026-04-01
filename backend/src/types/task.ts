export type TaskStatus = "pending" | "running" | "completed" | "failed";

export type PlanStep = {
  id: number;
  description: string;
  status: "pending" | "completed";
};

export type TaskPlan = {
  steps: PlanStep[];
};

export type Task = {
  id: number;
  input: string;
  plan: TaskPlan;
  status: TaskStatus;
  attempts: number;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  lastError: string | null;
  createdAt: string;
};

export type TaskLog = {
  id: number;
  taskId: number;
  message: string;
  timestamp: string;
};
