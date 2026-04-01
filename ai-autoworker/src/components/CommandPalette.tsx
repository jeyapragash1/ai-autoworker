"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredRole, setStoredRole, type UserRole } from "@/lib/role";

type Command = {
  id: string;
  title: string;
  subtitle: string;
  action: () => void;
};

export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<UserRole>(() => {
    if (typeof window === "undefined") {
      return "admin";
    }
    return getStoredRole();
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isCmdPalette = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (isCmdPalette) {
        event.preventDefault();
        setIsOpen((current) => !current);
      }

      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const commands = useMemo<Command[]>(
    () => [
      {
        id: "go-dashboard",
        title: "Go to Dashboard",
        subtitle: "Navigate to main workspace",
        action: () => router.push("/"),
      },
      {
        id: "go-tasks",
        title: "Go to Tasks",
        subtitle: "Open all task runs",
        action: () => router.push("/tasks"),
      },
      {
        id: "go-history",
        title: "Go to History",
        subtitle: "Open run timeline",
        action: () => router.push("/history"),
      },
      {
        id: "go-monitor",
        title: "Go to Monitor",
        subtitle: "Open system status page",
        action: () => router.push("/monitor"),
      },
      {
        id: "switch-admin",
        title: "Switch Role: Admin",
        subtitle: "Enable write actions",
        action: () => {
          setStoredRole("admin");
          setRole("admin");
        },
      },
      {
        id: "switch-viewer",
        title: "Switch Role: Viewer",
        subtitle: "Read-only mode",
        action: () => {
          setStoredRole("viewer");
          setRole("viewer");
        },
      },
    ],
    [router],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return commands;
    }

    return commands.filter((command) => {
      return (
        command.title.toLowerCase().includes(normalized) ||
        command.subtitle.toLowerCase().includes(normalized)
      );
    });
  }, [commands, query]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-24 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="border-b border-zinc-800 p-3">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Type a command..."
            className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none"
          />
          <p className="mt-2 text-xs text-zinc-500">
            Role: {role} | Shortcut: Ctrl/Cmd + K
          </p>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.map((command) => (
            <button
              key={command.id}
              onClick={() => {
                command.action();
                setIsOpen(false);
                setQuery("");
              }}
              className="mb-1 w-full rounded-lg border border-transparent px-3 py-2 text-left transition-colors hover:border-zinc-800 hover:bg-zinc-900"
            >
              <p className="text-sm font-medium text-zinc-100">{command.title}</p>
              <p className="text-xs text-zinc-500">{command.subtitle}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
