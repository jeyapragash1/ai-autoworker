"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getStoredRole, roleChangeEventName, setStoredRole, type UserRole } from "@/lib/role";

type Metrics = {
  totalTasks: number;
  runningTasks: number;
};

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "AI Agent", href: "/agent", adminOnly: true },
  { label: "Tasks", href: "/tasks" },
  { label: "History", href: "/history" },
  { label: "Monitor", href: "/monitor" },
  { label: "Settings", href: "/settings", adminOnly: true },
];

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export function Sidebar() {
  const pathname = usePathname();
  const [metrics, setMetrics] = useState<Metrics>({ totalTasks: 0, runningTasks: 0 });
  const [role, setRole] = useState<UserRole>(() => {
    if (typeof window === "undefined") {
      return "admin";
    }
    return getStoredRole();
  });

  const visibleNavItems = useMemo(() => {
    return navItems.filter((item) => !(item.adminOnly && role !== "admin"));
  }, [role]);

  useEffect(() => {
    const onRoleChange = () => {
      setRole(getStoredRole());
    };

    window.addEventListener(roleChangeEventName, onRoleChange);

    const fetchMetrics = async () => {
      try {
        const response = await fetch(`${apiBase}/api/metrics`, { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { metrics: Metrics };
        setMetrics({
          totalTasks: payload.metrics.totalTasks,
          runningTasks: payload.metrics.runningTasks,
        });
      } catch {
        // Keep sidebar usable even if API is temporarily unavailable.
      }
    };

    fetchMetrics().catch(() => {
      // No-op fallback.
    });

    const interval = setInterval(() => {
      fetchMetrics().catch(() => {
        // No-op fallback.
      });
    }, 15000);

    return () => {
      clearInterval(interval);
      window.removeEventListener(roleChangeEventName, onRoleChange);
    };
  }, []);

  return (
    <aside className="w-full border-b border-zinc-800 bg-zinc-950 md:fixed md:inset-y-0 md:left-0 md:w-[250px] md:border-b-0 md:border-r">
      <div className="flex h-full flex-col px-5 py-6">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-100">AI AutoWorker</h1>
        <p className="mt-1 text-xs text-zinc-500">Autonomous execution workspace</p>

        <nav className="mt-6 flex gap-2 md:flex-1 md:flex-col">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "border-zinc-600 bg-zinc-800 text-white shadow-[0_6px_20px_-12px_rgba(255,255,255,0.45)]"
                    : "border-transparent text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900 hover:text-zinc-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Live Stats</p>
          <div className="flex items-center justify-between text-sm text-zinc-300">
            <span>Total Tasks</span>
            <span className="font-semibold text-zinc-100">{metrics.totalTasks}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-zinc-300">
            <span>Running</span>
            <span className="font-semibold text-amber-300">{metrics.runningTasks}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-zinc-300">
            <span>Role</span>
            <span className="font-semibold capitalize text-zinc-100">{role}</span>
          </div>
          <button
            onClick={() => setStoredRole(role === "admin" ? "viewer" : "admin")}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs font-semibold text-zinc-200 transition-colors hover:bg-zinc-900"
          >
            Switch to {role === "admin" ? "Viewer" : "Admin"}
          </button>
        </div>
      </div>
    </aside>
  );
}