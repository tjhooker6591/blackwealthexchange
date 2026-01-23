import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  INTERN_TASKS,
  type InternTask,
  type InternTaskCategory,
  type InternTaskDifficulty,
} from "../../../lib/intern/tasks";

const categories: (InternTaskCategory | "all")[] = [
  "all",
  "UI",
  "Backend",
  "Database",
  "Security",
  "Content",
  "DX",
  "Bugfix",
];

const difficulties: (InternTaskDifficulty | "all")[] = [
  "all",
  "easy",
  "medium",
  "hard",
];

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-yellow-500/40 bg-black/40 px-3 py-1 text-xs text-yellow-200">
      {children}
    </span>
  );
}

function getSortedTasks(): InternTask[] {
  const base = Array.isArray(INTERN_TASKS) ? INTERN_TASKS : [];
  return [...base].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.estimatedHours - b.estimatedHours;
  });
}

export default function InternTasksPage() {
  const allTasks = useMemo<InternTask[]>(() => getSortedTasks(), []);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("all");
  const [difficulty, setDifficulty] =
    useState<(typeof difficulties)[number]>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return allTasks.filter((t: InternTask) => {
      const matchesQuery =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q) ||
        t.tags.join(" ").toLowerCase().includes(q);

      const matchesCategory = category === "all" || t.category === category;
      const matchesDifficulty =
        difficulty === "all" || t.difficulty === difficulty;

      return matchesQuery && matchesCategory && matchesDifficulty;
    });
  }, [allTasks, query, category, difficulty]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400">Intern Tasks</h1>
            <p className="mt-2 text-white/70">
              Pick a task, follow the steps, meet acceptance criteria, submit a
              PR.
            </p>
          </div>

          <Link
            href="/intern/dashboard"
            className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-200 hover:bg-yellow-500/15"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks (title, tags, summary)…"
            className="w-full rounded-xl border border-yellow-500/30 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-yellow-500/60"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="w-full rounded-xl border border-yellow-500/30 bg-black px-4 py-3 text-sm text-white outline-none focus:border-yellow-500/60"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as any)}
            className="w-full rounded-xl border border-yellow-500/30 bg-black px-4 py-3 text-sm text-white outline-none focus:border-yellow-500/60"
          >
            {difficulties.map((d) => (
              <option key={d} value={d}>
                Difficulty: {d}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4">
          {filtered.map((task: InternTask) => (
            <Link
              key={task.id}
              href={`/intern/tasks/${task.id}`}
              className="group rounded-2xl border border-yellow-500/20 bg-white/5 p-5 shadow-sm transition hover:border-yellow-500/40 hover:bg-white/7"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-yellow-200 group-hover:text-yellow-100">
                    {task.title}
                  </h2>
                  <p className="mt-2 text-white/70">{task.summary}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge>{task.category}</Badge>
                    <Badge>{task.difficulty}</Badge>
                    <Badge>Priority {task.priority}</Badge>
                    <Badge>{task.estimatedHours}h</Badge>
                  </div>
                </div>

                <div className="mt-2 text-sm text-white/50 md:mt-0">
                  {task.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="mr-2">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-yellow-500/20 bg-white/5 p-6 text-white/70">
              No tasks match your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
