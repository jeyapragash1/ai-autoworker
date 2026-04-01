type LogsPanelProps = {
  logs: string[];
};

export function LogsPanel({ logs }: LogsPanelProps) {
  return (
    <section className="rounded-lg border border-zinc-800 bg-black p-4 shadow-lg sm:p-5">
      <div className="mb-3 flex items-center gap-2 text-xs text-zinc-500">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="ml-2 uppercase tracking-[0.14em]">Runtime Logs</span>
      </div>
      <div className="h-44 overflow-y-auto rounded-lg border border-zinc-900 bg-zinc-950 p-3 font-mono text-sm leading-6 text-zinc-200 sm:h-52">
        {logs.map((log) => (
          <p key={log}>{log}</p>
        ))}
      </div>
    </section>
  );
}