import { TaskCard } from "@/components/TaskCard";

const taskQueue = [
  { title: "Analyze repository structure", status: "completed" as const },
  { title: "Generate implementation plan", status: "completed" as const },
  { title: "Execute migration steps", status: "running" as const },
  { title: "Finalize dashboard metrics", status: "running" as const },
];

export default function TasksPage() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-5 py-4 shadow-lg">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Tasks</h1>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {taskQueue.map((task) => (
          <TaskCard key={task.title} title={task.title} status={task.status} />
        ))}
      </section>
    </section>
  );
}