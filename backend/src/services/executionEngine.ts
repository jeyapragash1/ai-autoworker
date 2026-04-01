import type { TaskPlan } from "../types/task.js";
import { appendLogs, markTaskCompleted, markTaskFailed, markTaskRunning } from "../repositories/taskRepository.js";

type QueueItem = {
  taskId: number;
  plan: TaskPlan;
  attempt: number;
};

const MAX_RETRIES = 2;
const queue: QueueItem[] = [];
let isProcessing = false;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function processQueue(): Promise<void> {
  if (isProcessing) {
    return;
  }

  const item = queue.shift();
  if (!item) {
    return;
  }

  isProcessing = true;

  try {
    await runTask(item);
  } finally {
    isProcessing = false;
    void processQueue();
  }
}

async function runTask(item: QueueItem): Promise<void> {
  const { taskId, plan, attempt } = item;

  try {
    await markTaskRunning(taskId);
    await appendLogs(taskId, [`⚙ Worker started (attempt ${attempt})`]);

    await sleep(350);
    await appendLogs(taskId, ["✔ Initializing project..."]);
    await sleep(350);
    await appendLogs(taskId, ["✔ Installing dependencies..."]);
    await sleep(350);
    await appendLogs(taskId, ["⏳ Running server..."]);

    for (const step of plan.steps) {
      await sleep(250);
      await appendLogs(taskId, [`▶ ${step.description}`]);
    }

    await appendLogs(taskId, ["✔ Task execution completed"]);
    await markTaskCompleted(taskId);
  } catch {
    const finalFailure = attempt >= MAX_RETRIES + 1;
    const errorMessage = `Execution failed on attempt ${attempt}`;

    await appendLogs(taskId, [`✖ ${errorMessage}`]);
    await markTaskFailed(taskId, errorMessage, finalFailure);

    if (!finalFailure) {
      const backoffMs = 500 * 2 ** (attempt - 1);
      await appendLogs(taskId, [`↻ Retrying in ${backoffMs}ms`]);
      setTimeout(() => {
        queue.push({ taskId, plan, attempt: attempt + 1 });
        void processQueue();
      }, backoffMs);
    }
  }
}

export function enqueueTaskExecution(taskId: number, plan: TaskPlan): void {
  queue.push({ taskId, plan, attempt: 1 });
  void processQueue();
}
