const historyEntries = [
  {
    id: "RUN-221",
    summary: "Scaffolded Next.js dashboard module",
    time: "2 minutes ago",
  },
  {
    id: "RUN-220",
    summary: "Installed and validated dependencies",
    time: "18 minutes ago",
  },
  {
    id: "RUN-219",
    summary: "Generated project baseline structure",
    time: "43 minutes ago",
  },
];

export default function HistoryPage() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-5 py-4 shadow-lg">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">History</h1>
      </header>

      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/60 shadow-lg">
        <table className="w-full border-collapse text-left text-sm text-zinc-300">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="px-5 py-3 font-medium">Run ID</th>
              <th className="px-5 py-3 font-medium">Summary</th>
              <th className="px-5 py-3 font-medium">Executed</th>
            </tr>
          </thead>
          <tbody>
            {historyEntries.map((entry) => (
              <tr key={entry.id} className="border-t border-zinc-800 hover:bg-zinc-900/80">
                <td className="px-5 py-3 font-medium text-zinc-200">{entry.id}</td>
                <td className="px-5 py-3">{entry.summary}</td>
                <td className="px-5 py-3 text-zinc-400">{entry.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}