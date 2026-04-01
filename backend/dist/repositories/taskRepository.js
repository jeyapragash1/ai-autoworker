import { pool } from "../db/pool.js";
const mapTaskRow = (row) => ({
    id: Number(row.id),
    input: row.input,
    plan: row.plan,
    status: row.status,
    attempts: Number(row.attempts),
    startedAt: row.started_at,
    completedAt: row.completed_at,
    failedAt: row.failed_at,
    lastError: row.last_error,
    createdAt: row.created_at,
});
const mapLogRow = (row) => ({
    id: Number(row.id),
    taskId: Number(row.task_id),
    message: row.message,
    timestamp: row.timestamp,
});
export async function createTask(input, plan) {
    const result = await pool.query(`INSERT INTO tasks (input, plan, status)
     VALUES ($1, $2::jsonb, 'pending')
     RETURNING id, input, plan, status, attempts, started_at, completed_at, failed_at, last_error, created_at`, [input, JSON.stringify(plan)]);
    return mapTaskRow(result.rows[0]);
}
export async function appendLogs(taskId, messages) {
    if (messages.length === 0) {
        return;
    }
    const values = [];
    const params = [];
    messages.forEach((message, index) => {
        const base = index * 2;
        values.push(`($${base + 1}, $${base + 2})`);
        params.push(taskId, message);
    });
    await pool.query(`INSERT INTO logs (task_id, message) VALUES ${values.join(",")}`, params);
}
export async function markTaskRunning(taskId) {
    await pool.query(`UPDATE tasks
     SET status = 'running',
         attempts = attempts + 1,
         started_at = COALESCE(started_at, NOW()),
         last_error = NULL
     WHERE id = $1`, [taskId]);
}
export async function markTaskCompleted(taskId) {
    await pool.query("UPDATE tasks SET status = 'completed', completed_at = NOW(), last_error = NULL WHERE id = $1", [taskId]);
}
export async function markTaskFailed(taskId, errorMessage, finalFailure) {
    await pool.query(`UPDATE tasks
     SET status = CASE WHEN $3 THEN 'failed' ELSE 'pending' END,
         failed_at = CASE WHEN $3 THEN NOW() ELSE failed_at END,
         last_error = $2
     WHERE id = $1`, [taskId, errorMessage, finalFailure]);
}
export async function getTaskById(taskId) {
    const taskResult = await pool.query("SELECT id, input, plan, status, attempts, started_at, completed_at, failed_at, last_error, created_at FROM tasks WHERE id = $1", [taskId]);
    if (taskResult.rows.length === 0) {
        return null;
    }
    const logsResult = await pool.query("SELECT id, task_id, message, timestamp FROM logs WHERE task_id = $1 ORDER BY timestamp ASC", [taskId]);
    return {
        task: mapTaskRow(taskResult.rows[0]),
        logs: logsResult.rows.map(mapLogRow),
    };
}
export async function getAllTasks() {
    const result = await pool.query("SELECT id, input, plan, status, attempts, started_at, completed_at, failed_at, last_error, created_at FROM tasks ORDER BY created_at DESC");
    return result.rows.map(mapTaskRow);
}
export async function getTaskMetrics() {
    const result = await pool.query(`
    SELECT
      COUNT(*)::text AS total_tasks,
      COUNT(*) FILTER (WHERE status = 'completed')::text AS completed_tasks,
      COUNT(*) FILTER (WHERE status = 'failed')::text AS failed_tasks,
      COUNT(*) FILTER (WHERE status = 'running')::text AS running_tasks,
      AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) FILTER (
        WHERE status = 'completed' AND started_at IS NOT NULL AND completed_at IS NOT NULL
      )::text AS avg_duration_seconds
    FROM tasks
  `);
    const row = result.rows[0];
    const totalTasks = Number(row.total_tasks);
    const completedTasks = Number(row.completed_tasks);
    const failedTasks = Number(row.failed_tasks);
    const runningTasks = Number(row.running_tasks);
    const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const avgDurationSeconds = row.avg_duration_seconds ? Number(row.avg_duration_seconds) : 0;
    return {
        totalTasks,
        completedTasks,
        failedTasks,
        runningTasks,
        successRate,
        avgDurationSeconds,
    };
}
export async function requeueTask(taskId) {
    const result = await pool.query(`UPDATE tasks
     SET status = 'pending',
         completed_at = NULL,
         failed_at = NULL,
         last_error = NULL
     WHERE id = $1
     RETURNING id, input, plan, status, attempts, started_at, completed_at, failed_at, last_error, created_at`, [taskId]);
    if (result.rows.length === 0) {
        return null;
    }
    return mapTaskRow(result.rows[0]);
}
