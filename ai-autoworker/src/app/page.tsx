"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LogsPanel } from "@/components/LogsPanel";
import { TaskCard } from "@/components/TaskCard";
import { TaskInput } from "@/components/TaskInput";
import { getStoredRole, roleChangeEventName, type UserRole } from "@/lib/role";
import { showToast } from "@/lib/toast";

type TaskStatus = "pending" | "running" | "completed" | "failed";

type Task = {
  id: number;
  input: string;
  status: TaskStatus;
  attempts: number;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  lastError: string | null;
  createdAt: string;
};

type Metrics = {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  runningTasks: number;
  successRate: number;
  avgDurationSeconds: number;
};

type TaskLog = {
  id: number;
  message: string;
};

type TaskDetailsResponse = {
  task: Task;
  logs: TaskLog[];
};

type HealthStatus = {
  ok: boolean;
  status: string;
};

type ReadyStatus = {
  ok: boolean;
  status: string;
  database: string;
};

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [searchValue, setSearchValue] = useState("");
  const [isRetrying, setIsRetrying] = useState(false);
  const [systemHealth, setSystemHealth] = useState<HealthStatus | null>(null);
  const [systemReady, setSystemReady] = useState<ReadyStatus | null>(null);
  const [systemUpdatedAt, setSystemUpdatedAt] = useState<string>("-");
  const [role, setRole] = useState<UserRole>(() => {
    if (typeof window === "undefined") {
      return "admin";
    }
    return getStoredRole();
  });
  const [metrics, setMetrics] = useState<Metrics>({
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    runningTasks: 0,
    successRate: 0,
    avgDurationSeconds: 0,
  });

  const fetchTasks = useCallback(async () => {
    const response = await fetch(`${apiBase}/api/tasks`, { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Failed to load tasks");
    }

    const payload = (await response.json()) as { tasks: Task[] };
    setTasks(payload.tasks);

    setSelectedTaskId((current) => {
      if (payload.tasks.length === 0) {
        return null;
      }

      if (current && payload.tasks.some((task) => task.id === current)) {
        return current;
      }

      return payload.tasks[0].id;
    });
  }, []);

  const fetchTaskDetails = useCallback(async (taskId: number) => {
    const response = await fetch(`${apiBase}/api/task/${taskId}`, { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Failed to load task details");
    }

    const payload = (await response.json()) as TaskDetailsResponse;
    setTasks((current) =>
      current.map((task) =>
        task.id === payload.task.id ? { ...task, status: payload.task.status } : task,
      ),
    );
    setLogs(payload.logs.map((log) => log.message));
  }, []);

  const fetchMetrics = useCallback(async () => {
    const response = await fetch(`${apiBase}/api/metrics`, { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Failed to load metrics");
    }

    const payload = (await response.json()) as { metrics: Metrics };
    setMetrics(payload.metrics);
  }, []);

  const fetchSystemStatus = useCallback(async () => {
    const [healthResponse, readyResponse] = await Promise.all([
      fetch(`${apiBase}/health`, { cache: "no-store" }),
      fetch(`${apiBase}/readyz`, { cache: "no-store" }),
    ]);

    if (!healthResponse.ok) {
      throw new Error("Failed to load health status");
    }

    const healthPayload = (await healthResponse.json()) as HealthStatus;
    setSystemHealth(healthPayload);

    if (!readyResponse.ok) {
      setSystemReady({ ok: false, status: "not_ready", database: "disconnected" });
    } else {
      const readyPayload = (await readyResponse.json()) as ReadyStatus;
      setSystemReady(readyPayload);
    }

    setSystemUpdatedAt(new Date().toLocaleTimeString());
  }, []);

  useEffect(() => {
    const onRoleChange = () => {
      setRole(getStoredRole());
    };

    window.addEventListener(roleChangeEventName, onRoleChange);
    return () => {
      window.removeEventListener(roleChangeEventName, onRoleChange);
    };
  }, []);

  useEffect(() => {
    fetchTasks().catch(() => {
      setErrorMessage("Unable to load tasks right now.");
    });
    fetchMetrics().catch(() => {
      setErrorMessage("Unable to load metrics right now.");
    });
    fetchSystemStatus().catch(() => {
      setErrorMessage("Unable to load system status right now.");
    });
  }, [fetchMetrics, fetchSystemStatus, fetchTasks]);

  useEffect(() => {
    if (!selectedTaskId) {
      setLogs([]);
      return;
    }

    fetchTaskDetails(selectedTaskId).catch(() => {
      setErrorMessage("Unable to load task logs right now.");
    });
  }, [fetchTaskDetails, selectedTaskId]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchTasks().catch(() => {
        setErrorMessage("Unable to refresh task list.");
      });
      fetchMetrics().catch(() => {
        setErrorMessage("Unable to refresh metrics.");
      });
      fetchSystemStatus().catch(() => {
        setErrorMessage("Unable to refresh system status.");
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchMetrics, fetchSystemStatus, fetchTasks]);

  useEffect(() => {
    if (!selectedTaskId) {
      return;
    }

    const stream = new EventSource(`${apiBase}/api/task/${selectedTaskId}/stream`);

    stream.onmessage = (event) => {
      const payload = JSON.parse(event.data) as TaskDetailsResponse;
      setTasks((current) =>
        current.map((task) =>
          task.id === payload.task.id ? { ...task, status: payload.task.status } : task,
        ),
      );
      setLogs(payload.logs.map((log) => log.message));
      setErrorMessage(undefined);
    };

    stream.onerror = () => {
      setErrorMessage("Live updates disconnected. Retrying...");
    };

    return () => {
      stream.close();
    };
  }, [selectedTaskId]);

  const submitTask = useCallback(async (input: string) => {
    if (role !== "admin") {
      showToast("Viewer mode is read-only. Switch to Admin to run tasks.", "info");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(undefined);

    try {
      const response = await fetch(`${apiBase}/api/task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        throw new Error("Task submission failed");
      }

      const payload = (await response.json()) as { task: Task };
      await fetchTasks();
      await fetchMetrics();
      setSelectedTaskId(payload.task.id);
      await fetchTaskDetails(payload.task.id);
      showToast("Task submitted successfully!", "success");
    } catch {
      setErrorMessage("Task run failed. Please try again.");
      showToast("Task submission failed. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchMetrics, fetchTaskDetails, fetchTasks, role]);

  const retryTask = useCallback(async () => {
    if (role !== "admin") {
      showToast("Viewer mode is read-only. Switch to Admin to retry tasks.", "info");
      return;
    }

    if (!selectedTaskId) {
      return;
    }

    setIsRetrying(true);
    setErrorMessage(undefined);

    try {
      const response = await fetch(`${apiBase}/api/task/${selectedTaskId}/retry`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Retry failed");
      }

      await fetchTasks();
      await fetchMetrics();
      await fetchTaskDetails(selectedTaskId);
      showToast("Task retry queued successfully!", "success");
    } catch {
      setErrorMessage("Unable to retry this task right now.");
      showToast("Task retry failed. Please try again.", "error");
    } finally {
      setIsRetrying(false);
    }
  }, [fetchMetrics, fetchTaskDetails, fetchTasks, role, selectedTaskId]);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks],
  );

  const taskCards = useMemo(() => {
    const byStatus = statusFilter === "all" ? tasks : tasks.filter((task) => task.status === statusFilter);
    const bySearch = searchValue.trim()
      ? byStatus.filter((task) => task.input.toLowerCase().includes(searchValue.toLowerCase()))
      : byStatus;
    return bySearch.slice(0, 8);
  }, [searchValue, statusFilter, tasks]);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-5 py-4 shadow-lg">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Dashboard</h1>
      </header>

      {role === "admin" ? (
        <TaskInput onSubmit={submitTask} isSubmitting={isSubmitting} errorMessage={errorMessage} />
      ) : (
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-400 shadow-lg">
          Viewer mode enabled. Task creation is disabled.
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Total Tasks</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-100">{metrics.totalTasks}</p>
        </article>
        <article className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Success Rate</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-400">
            {metrics.successRate.toFixed(1)}%
          </p>
        </article>
        <article className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Running</p>
          <p className="mt-2 text-2xl font-semibold text-amber-300">{metrics.runningTasks}</p>
        </article>
        <article className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Avg Duration</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-100">
            {metrics.avgDurationSeconds.toFixed(1)}s
          </p>
        </article>
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">System Monitor</p>
            <p className="mt-2 text-sm text-zinc-200">
              API: {systemHealth?.status ?? "unknown"} | DB: {systemReady?.database ?? "unknown"}
            </p>
            <p className="mt-1 text-xs text-zinc-500">Last checked: {systemUpdatedAt}</p>
          </div>
          <button
            onClick={() => {
              fetchSystemStatus().catch(() => {
                setErrorMessage("Unable to refresh system status.");
              });
            }}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:bg-zinc-900"
          >
            Refresh Status
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search tasks..."
            className="h-10 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-500"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "all" | TaskStatus)}
            className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {taskCards.length > 0 ? (
          taskCards.map((task) => (
            <TaskCard
              key={task.id}
              id={task.id}
              title={task.input}
              status={task.status}
              isSelected={task.id === selectedTaskId}
              onSelect={setSelectedTaskId}
            />
          ))
        ) : (
          <article className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-5 text-sm text-zinc-400 shadow-lg">
            No tasks yet. Run your first task to start execution.
          </article>
        )}
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-5 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-400">
              Selected Task Details
            </h2>
            <p className="mt-2 text-base font-medium text-zinc-100">
              {selectedTask ? selectedTask.input : "No task selected"}
            </p>
          </div>
          <button
            onClick={retryTask}
            disabled={!selectedTaskId || isRetrying || role !== "admin"}
            className="rounded-lg border border-zinc-600 bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-950 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isRetrying ? "Retrying..." : "Retry Task"}
          </button>
        </div>

        {selectedTask ? (
          <div className="mt-4 grid gap-3 text-sm text-zinc-300 sm:grid-cols-2">
            <p>Status: <span className="capitalize text-zinc-100">{selectedTask.status}</span></p>
            <p>Attempts: <span className="text-zinc-100">{selectedTask.attempts}</span></p>
            <p>Started: <span className="text-zinc-100">{selectedTask.startedAt ?? "-"}</span></p>
            <p>Completed: <span className="text-zinc-100">{selectedTask.completedAt ?? "-"}</span></p>
            <p>Failed: <span className="text-zinc-100">{selectedTask.failedAt ?? "-"}</span></p>
            <p>Last Error: <span className="text-zinc-100">{selectedTask.lastError ?? "-"}</span></p>
          </div>
        ) : null}
      </section>

      <LogsPanel logs={logs.length > 0 ? logs : ["No logs yet for the selected task."]} />
    </section>
  );
}
