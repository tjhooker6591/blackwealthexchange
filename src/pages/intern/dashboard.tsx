import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { INTERN_TASKS, type InternTask } from "../../lib/intern/tasks";

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

function getSortedTasks(): InternTask[] {
  const base = Array.isArray(INTERN_TASKS) ? INTERN_TASKS : [];
  return [...base].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.estimatedHours - b.estimatedHours;
  });
}

export default function InternDashboardPage() {
  const tasks = useMemo<InternTask[]>(() => getSortedTasks(), []);
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    setCompleted(loadCompleted());
  }, []);

  const completedCount = completed.length;
  const totalCount = tasks.length;

  const topNext =
    tasks.find((t: InternTask) => !completed.includes(t.id)) || tasks[0];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border border-yellow-500/20 bg-white/5 p-6">
          <h1 className="text-3xl font-bold text-yellow-400">Intern Hub</h1>
          <p className="mt-2 text-white/70">
            Onboard yourself, pick a task, finish it end-to-end, ship a clean
            PR.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/intern/tasks"
              className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-200 hover:bg-yellow-500/15"
            >
              Browse Tasks
            </Link>

            <a
              href="/INTERN_ONBOARDING.md"
              className="rounded-xl border border-yellow-500/20 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              Read Onboarding
            </a>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-yellow-500/20 bg-black/30 p-5">
              <p className="text-sm text-white/60">Progress</p>
              <p className="mt-2 text-2xl font-semibold text-yellow-200">
                {completedCount}/{totalCount}
              </p>
              <p className="mt-1 text-sm text-white/60">tasks completed</p>
            </div>

            <div className="rounded-2xl border border-yellow-500/20 bg-black/30 p-5 md:col-span-2">
              <p className="text-sm text-white/60">Suggested next task</p>
              {topNext ? (
                <div className="mt-2">
                  <p className="text-lg font-semibold text-yellow-200">
                    {topNext.title}
                  </p>
                  <p className="mt-1 text-white/70">{topNext.summary}</p>
                  <div className="mt-3">
                    <Link
                      href={`/intern/tasks/${topNext.id}`}
                      className="inline-flex rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-200 hover:bg-yellow-500/15"
                    >
                      Open Task
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-white/70">No tasks found.</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-yellow-500/20 bg-white/5 p-6">
            <h2 className="text-xl font-semibold text-yellow-200">
              Your workflow (do this every task)
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-white/75">
              <li>
                Pick a task from{" "}
                <code className="text-yellow-200">/intern/tasks</code>
              </li>
              <li>
                Create branch:{" "}
                <code className="text-yellow-200">
                  intern/&lt;name&gt;/&lt;taskId&gt;
                </code>
              </li>
              <li>Implement steps + meet acceptance criteria</li>
              <li>
                Run: <code className="text-yellow-200">npm run lint</code>
              </li>
              <li>Submit PR with screenshots + test plan</li>
            </ol>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-white/5 p-6">
            <h2 className="text-xl font-semibold text-yellow-200">
              Need a task?
            </h2>
            <p className="mt-3 text-white/70">
              Start with an <span className="text-yellow-200">easy</span> UI
              task to learn the codebase, then move into medium/hard tasks.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/intern/tasks?difficulty=easy"
                className="rounded-xl border border-yellow-500/20 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                Easy Tasks
              </Link>
              <Link
                href="/intern/tasks"
                className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-200 hover:bg-yellow-500/15"
              >
                All Tasks
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
