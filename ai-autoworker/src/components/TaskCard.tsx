type TaskStatus = "running" | "completed";

type TaskCardProps = {
  title: string;
  status: TaskStatus;
};

const statusClassMap: Record<TaskStatus, string> = {
  running: "bg-amber-400",
  completed: "bg-emerald-400",
};

export function TaskCard({ title, status }: TaskCardProps) {
  return (
    <article className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-5 shadow-lg transition-colors duration-200 hover:border-zinc-700">
      <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-xs font-medium text-zinc-300">
        <span className={`h-2.5 w-2.5 rounded-full ${statusClassMap[status]}`} />
        <span className="capitalize">{status}</span>
      </div>
    </article>
  );
}