// src/pages/intern/tasks/[taskId].tsx

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

// ✅ Bypass alias completely (guaranteed resolution)
import { getInternTaskById, type InternTask } from "../../../lib/intern/tasks";

const STORAGE_KEY = "bwe_intern_completed_tasks";

function loadCompleted(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveCompleted(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-yellow-500/20 bg-white/5 p-5">
      <h2 className="text-lg font-semibold text-yellow-200">{title}</h2>
      <div className="mt-3 text-white/75">{children}</div>
    </section>
  );
}

export default function InternTaskDetailPage() {
  const router = useRouter();

  const taskId =
    typeof router.query.taskId === "string" ? router.query.taskId : "";

  // ✅ extra guard: if import breaks again, we fail gracefully instead of crashing
  const task: InternTask | undefined = useMemo(() => {
    if (!taskId) return undefined;
    if (typeof getInternTaskById !== "function") return undefined;
    return getInternTaskById(taskId);
  }, [taskId]);

  const [completedIds, setCompletedIds] = useState<string[]>([]);

  useEffect(() => {
    setCompletedIds(loadCompleted());
  }, []);

  const isCompleted = !!task && completedIds.includes(task.id);

  function toggleComplete() {
    if (!task) return;

    const next = isCompleted
      ? completedIds.filter((id) => id !== task.id)
      : [...completedIds, task.id];

    setCompletedIds(next);
    saveCompleted(next);
  }

  if (!taskId) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-4xl px-4 py-10">Loading…</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <h1 className="text-2xl font-bold text-yellow-400">Task not found</h1>
          <p className="mt-2 text-white/70">
            That taskId doesn’t exist (or the tasks module didn’t load). Pick a
            task from the list.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/intern/tasks"
              className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-200 hover:bg-yellow-500/15"
            >
              Back to Tasks
            </Link>
            <Link
              href="/intern/dashboard"
              className="rounded-xl border border-yellow-500/20 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400">{task.title}</h1>
            <p className="mt-2 text-white/70">{task.summary}</p>
            <p className="mt-2 text-sm text-white/50">
              <span className="mr-3">Category: {task.category}</span>
              <span className="mr-3">Difficulty: {task.difficulty}</span>
              <span className="mr-3">Priority: {task.priority}</span>
              <span>{task.estimatedHours}h</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={toggleComplete}
              className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-200 hover:bg-yellow-500/15"
            >
              {isCompleted ? "Mark as Incomplete" : "Mark as Complete"}
            </button>

            <Link
              href="/intern/tasks"
              className="rounded-xl border border-yellow-500/20 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              Back to Tasks
            </Link>

            <Link
              href="/intern/dashboard"
              className="rounded-xl border border-yellow-500/20 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              Dashboard
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          <Section title="Context">
            <p>{task.context}</p>
          </Section>

          <Section title="Steps">
            <ol className="list-decimal space-y-2 pl-5">
              {task.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </Section>

          <Section title="Acceptance Criteria">
            <ul className="list-disc space-y-2 pl-5">
              {task.acceptanceCriteria.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </Section>

          <Section title="Deliverables">
            <ul className="list-disc space-y-2 pl-5">
              {task.deliverables.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </Section>

          {!!task.resources?.length && (
            <Section title="Resources">
              <ul className="list-disc space-y-2 pl-5">
                {task.resources.map((r) => (
                  <li key={r.url}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-yellow-200 hover:text-yellow-100 underline underline-offset-4"
                    >
                      {r.label}
                    </a>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {!!task.stretchGoals?.length && (
            <Section title="Stretch Goals">
              <ul className="list-disc space-y-2 pl-5">
                {task.stretchGoals.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
