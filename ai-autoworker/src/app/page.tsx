import { LogsPanel } from "@/components/LogsPanel";
import { TaskCard } from "@/components/TaskCard";
import { TaskInput } from "@/components/TaskInput";

const tasks = [
  { title: "Generate Next.js app scaffold", status: "completed" as const },
  { title: "Install and configure dependencies", status: "completed" as const },
  { title: "Build dashboard components", status: "running" as const },
  { title: "Run validation checks", status: "running" as const },
];

const logs = [
  "✔ Initializing project...",
  "✔ Installing dependencies...",
  "⏳ Running server...",
];

export default function Home() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-5 py-4 shadow-lg">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Dashboard</h1>
      </header>

      <TaskInput />

      <section className="grid gap-4 md:grid-cols-2">
        {tasks.map((task) => (
          <TaskCard key={task.title} title={task.title} status={task.status} />
        ))}
      </section>

      <LogsPanel logs={logs} />
    </section>
  );
}
