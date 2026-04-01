"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Tasks", href: "/tasks" },
  { label: "History", href: "/history" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-zinc-800 bg-zinc-950 md:fixed md:inset-y-0 md:left-0 md:w-[250px] md:border-b-0 md:border-r">
      <div className="flex h-full flex-col px-5 py-6">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-100">AI AutoWorker</h1>

        <nav className="mt-6 flex gap-2 md:flex-1 md:flex-col">
          {navItems.map((item) => {
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
      </div>
    </aside>
  );
}