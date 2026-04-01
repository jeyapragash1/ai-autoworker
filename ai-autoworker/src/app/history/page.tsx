"use client";

import { useEffect, useMemo, useState } from "react";

type TaskStatus = "pending" | "running" | "completed" | "failed";

type Task = {
  id: number;
  input: string;
  status: TaskStatus;
  attempts: number;
  createdAt: string;
};

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function HistoryPage() {
  const [historyEntries, setHistoryEntries] = useState<Task[]>([]);

  const csvContent = useMemo(() => {
    const header = ["run_id", "task", "status", "attempts", "created_at"].join(",");
    const rows = historyEntries.map((entry) => {
      return [
        `RUN-${entry.id}`,
        `"${entry.input.replaceAll("\"", "\"\"")}"`,
        entry.status,
        String(entry.attempts),
        entry.createdAt,
      ].join(",");
    });

    return [header, ...rows].join("\n");
  }, [historyEntries]);

  const exportCsv = () => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ai-autoworker-history-${new Date().toISOString()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    window.print();
  };

  useEffect(() => {
    const fetchHistory = async () => {
      const response = await fetch(`${apiBase}/api/tasks`, { cache: "no-store" });
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { tasks: Task[] };
      setHistoryEntries(payload.tasks);
    };

    fetchHistory().catch(() => {
      // Keep page usable when API is unavailable.
    });
  }, []);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-5 py-4 shadow-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">History</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:bg-zinc-900"
            >
              Export CSV
            </button>
            <button
              onClick={exportPdf}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:bg-zinc-900"
            >
              Export PDF
            </button>
          </div>
        </div>
      </header>

      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/60 shadow-lg">
        <table className="w-full border-collapse text-left text-sm text-zinc-300">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="px-5 py-3 font-medium">Run ID</th>
              <th className="px-5 py-3 font-medium">Task</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Attempts</th>
              <th className="px-5 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {historyEntries.map((entry) => (
              <tr key={entry.id} className="border-t border-zinc-800 hover:bg-zinc-900/80">
                <td className="px-5 py-3 font-medium text-zinc-200">RUN-{entry.id}</td>
                <td className="max-w-[280px] truncate px-5 py-3">{entry.input}</td>
                <td className="px-5 py-3 capitalize text-zinc-200">{entry.status}</td>
                <td className="px-5 py-3 text-zinc-300">{entry.attempts}</td>
                <td className="px-5 py-3 text-zinc-400">
                  {new Date(entry.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}