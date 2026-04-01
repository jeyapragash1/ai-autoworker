"use client";

import { useCallback, useEffect, useState } from "react";

type HealthStatus = {
  ok: boolean;
  status: string;
};

type ReadyStatus = {
  ok: boolean;
  status: string;
  database: string;
};

type Metrics = {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  runningTasks: number;
  successRate: number;
  avgDurationSeconds: number;
};

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function MonitorPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [ready, setReady] = useState<ReadyStatus | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [lastRefresh, setLastRefresh] = useState("-");

  const loadMonitorData = useCallback(async () => {
    const [healthRes, readyRes, metricsRes] = await Promise.all([
      fetch(`${apiBase}/health`, { cache: "no-store" }),
      fetch(`${apiBase}/readyz`, { cache: "no-store" }),
      fetch(`${apiBase}/api/metrics`, { cache: "no-store" }),
    ]);

    if (healthRes.ok) {
      setHealth((await healthRes.json()) as HealthStatus);
    }

    if (readyRes.ok) {
      setReady((await readyRes.json()) as ReadyStatus);
    }

    if (metricsRes.ok) {
      const payload = (await metricsRes.json()) as { metrics: Metrics };
      setMetrics(payload.metrics);
    }

    setLastRefresh(new Date().toLocaleTimeString());
  }, []);

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      loadMonitorData().catch(() => {
        // Keep monitor page rendered even if some probes fail.
      });
    }, 0);

    const interval = setInterval(() => {
      loadMonitorData().catch(() => {
        // Keep monitor page rendered even if some probes fail.
      });
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimer);
    };
  }, [loadMonitorData]);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-5 py-4 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Monitor</h1>
          <button
            onClick={() => {
              loadMonitorData().catch(() => {
                // Keep monitor page rendered even if refresh fails.
              });
            }}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:bg-zinc-900"
          >
            Refresh
          </button>
        </div>
        <p className="mt-2 text-xs text-zinc-500">Last refresh: {lastRefresh}</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">API Health</p>
          <p className="mt-2 text-xl font-semibold text-zinc-100">{health?.status ?? "unknown"}</p>
        </article>
        <article className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Database</p>
          <p className="mt-2 text-xl font-semibold text-zinc-100">{ready?.database ?? "unknown"}</p>
        </article>
        <article className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-400">Success Rate</p>
          <p className="mt-2 text-xl font-semibold text-emerald-400">
            {metrics ? `${metrics.successRate.toFixed(1)}%` : "-"}
          </p>
        </article>
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-400">Execution Overview</h2>
        <div className="mt-4 grid gap-3 text-sm text-zinc-300 sm:grid-cols-2 lg:grid-cols-4">
          <p>Total: <span className="text-zinc-100">{metrics?.totalTasks ?? 0}</span></p>
          <p>Completed: <span className="text-zinc-100">{metrics?.completedTasks ?? 0}</span></p>
          <p>Failed: <span className="text-zinc-100">{metrics?.failedTasks ?? 0}</span></p>
          <p>Running: <span className="text-zinc-100">{metrics?.runningTasks ?? 0}</span></p>
        </div>
      </section>
    </section>
  );
}
