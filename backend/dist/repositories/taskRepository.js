import { pool } from "../db/pool.js";
const mapTaskRow = (row) => ({
    id: Number(row.id),
    input: row.input,
    plan: row.plan,
    status: row.status,
    createdAt: row.created_at,
});
const mapLogRow = (row) => ({
    id: Number(row.id),
    taskId: Number(row.task_id),
    message: row.message,
    timestamp: row.timestamp,
});
export async function createTask(input, plan) {
    const result = await pool.query("INSERT INTO tasks (input, plan, status) VALUES ($1, $2::jsonb, 'running') RETURNING id, input, plan, status, created_at", [input, JSON.stringify(plan)]);
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
export async function markTaskCompleted(taskId) {
    await pool.query("UPDATE tasks SET status = 'completed' WHERE id = $1", [taskId]);
}
export async function markTaskFailed(taskId) {
    await pool.query("UPDATE tasks SET status = 'failed' WHERE id = $1", [taskId]);
}
export async function getTaskById(taskId) {
    const taskResult = await pool.query("SELECT id, input, plan, status, created_at FROM tasks WHERE id = $1", [taskId]);
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
    const result = await pool.query("SELECT id, input, plan, status, created_at FROM tasks ORDER BY created_at DESC");
    return result.rows.map(mapTaskRow);
}
