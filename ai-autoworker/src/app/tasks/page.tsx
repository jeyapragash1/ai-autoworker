"use client";

import { useEffect, useMemo, useState } from "react";
import { TaskCard } from "@/components/TaskCard";

type TaskStatus = "pending" | "running" | "completed" | "failed";

type Task = {
  id: number;
  input: string;
  status: TaskStatus;
  createdAt: string;
};

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sortBy, setSortBy] = useState<"latest" | "oldest">("latest");

  useEffect(() => {
    const fetchTasks = async () => {
      const response = await fetch(`${apiBase}/api/tasks`, { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as { tasks: Task[] };
      setTasks(payload.tasks);
    };

    fetchTasks().catch(() => {
      // Keep page usable when backend is unavailable.
    });
  }, []);

  const visibleTasks = useMemo(() => {
    const cloned = [...tasks];
    if (sortBy === "latest") {
      cloned.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    } else {
      cloned.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
    }
    return cloned;
  }, [sortBy, tasks]);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-5 py-4 shadow-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Tasks</h1>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as "latest" | "oldest")}
            className="h-9 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200 outline-none"
          >
            <option value="latest">Latest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {visibleTasks.length > 0 ? (
          visibleTasks.map((task) => (
            <TaskCard key={task.id} id={task.id} title={task.input} status={task.status} />
          ))
        ) : (
          <article className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-5 text-sm text-zinc-400 shadow-lg">
            No tasks found yet.
          </article>
        )}
      </section>
    </section>
  );
}