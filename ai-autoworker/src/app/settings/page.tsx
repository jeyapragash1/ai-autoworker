"use client";

import { useState } from "react";
import { getStoredRole, setStoredRole, type UserRole } from "@/lib/role";

type Preferences = {
  autoRefresh: boolean;
  desktopNotifications: boolean;
  compactCards: boolean;
};

const storageKey = "ai-autoworker-preferences";

export default function SettingsPage() {
  const [role, setRole] = useState<UserRole>(() => {
    if (typeof window === "undefined") {
      return "admin";
    }
    return getStoredRole();
  });
  const [preferences, setPreferences] = useState<Preferences>(() => {
    const defaults: Preferences = {
      autoRefresh: true,
      desktopNotifications: false,
      compactCards: false,
    };

    if (typeof window === "undefined") {
      return defaults;
    }

    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return defaults;
    }

    try {
      return JSON.parse(raw) as Preferences;
    } catch {
      return defaults;
    }
  });

  const updatePreference = (key: keyof Preferences) => {
    setPreferences((current) => {
      const next = { ...current, [key]: !current[key] };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-5 py-4 shadow-lg">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Settings</h1>
        <p className="mt-2 text-sm text-zinc-400">Personalize your AI AutoWorker workspace behavior.</p>
      </header>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-400">Access Role</h2>
        <div className="mt-3 flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
          <div>
            <p className="text-sm font-semibold text-zinc-100">Current Role</p>
            <p className="mt-1 text-xs text-zinc-500">Admin can run and retry tasks. Viewer has read-only access.</p>
          </div>
          <select
            value={role}
            onChange={(event) => {
              const nextRole = event.target.value as UserRole;
              setRole(nextRole);
              setStoredRole(nextRole);
            }}
            className="h-9 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none"
          >
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg">
        {[{
          key: "autoRefresh",
          title: "Enable Auto Refresh",
          description: "Refresh dashboard metrics and task state automatically.",
        }, {
          key: "desktopNotifications",
          title: "Desktop Notifications",
          description: "Receive browser notifications for task completion and failures.",
        }, {
          key: "compactCards",
          title: "Compact Task Cards",
          description: "Reduce visual density for a higher information layout.",
        }].map((item) => (
          <label
            key={item.key}
            className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-950/70 p-4"
          >
            <div>
              <p className="text-sm font-semibold text-zinc-100">{item.title}</p>
              <p className="mt-1 text-xs text-zinc-500">{item.description}</p>
            </div>
            <input
              type="checkbox"
              checked={preferences[item.key as keyof Preferences]}
              onChange={() => updatePreference(item.key as keyof Preferences)}
              className="mt-1 h-4 w-4 accent-zinc-200"
            />
          </label>
        ))}
      </section>
    </section>
  );
}
