"use client";

import { useMemo, useState } from "react";

type LogsPanelProps = {
  logs: string[];
};

export function LogsPanel({ logs }: LogsPanelProps) {
  const [copied, setCopied] = useState(false);
  const mergedLogs = useMemo(() => logs.join("\n"), [logs]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(mergedLogs);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleDownload = () => {
    const blob = new Blob([mergedLogs], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ai-autoworker-logs-${new Date().toISOString()}.log`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="rounded-lg border border-zinc-800 bg-black p-4 shadow-lg sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-2 uppercase tracking-[0.14em]">Runtime Logs</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            Download Logs
          </button>
          <button
            onClick={handleCopy}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            {copied ? "Copied" : "Copy Logs"}
          </button>
        </div>
      </div>
      <div className="h-44 overflow-y-auto rounded-lg border border-zinc-900 bg-zinc-950 p-3 font-mono text-sm leading-6 text-zinc-200 sm:h-52">
        {logs.map((log, index) => (
          <p key={`${index}-${log}`}>{log}</p>
        ))}
      </div>
    </section>
  );
}