import { appendLogs, markTaskCompleted, markTaskFailed } from "../repositories/taskRepository.js";
export function executeTaskAsync(taskId, plan) {
    const baseLogs = ["✔ Initializing project...", "✔ Installing dependencies...", "⏳ Running server..."];
    const planLogs = plan.steps.map((step) => `▶ ${step.description}`);
    setTimeout(async () => {
        try {
            await appendLogs(taskId, [...baseLogs, ...planLogs, "✔ Task execution completed"]);
            await markTaskCompleted(taskId);
        }
        catch {
            await appendLogs(taskId, ["✖ Task execution failed"]);
            await markTaskFailed(taskId);
        }
    }, 300);
}
