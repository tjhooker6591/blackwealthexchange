import Link from "next/link";
import { useEffect, useState } from "react";

type Item = { label: string; href: string };

export default function SupportCategoryPage({
  title,
  intro,
  commonIssues,
  quickActions,
  guidedActions,
  decisionGuidance,
  scenarios,
  stepHints,
  nextActions,
}: {
  title: string;
  intro: string;
  commonIssues: string[];
  quickActions: Item[];
  guidedActions: { label: string; category: string; priority?: string }[];
  decisionGuidance: string[];
  scenarios: string[];
  stepHints: string[];
  nextActions: string[];
}) {
  const [status, setStatus] = useState<any>(null);
  useEffect(() => {
    fetch("/api/support/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => null);
  }, []);

  const Mini = ({ title, items }: { title: string; items: string[] }) => (
    <section className="rounded border border-zinc-800 bg-zinc-950 p-4">
      <h2 className="text-lg font-semibold text-yellow-300 mb-2">{title}</h2>
      <ul className="list-disc pl-5 space-y-1 text-zinc-200 text-sm">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </section>
  );

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto space-y-4">
        <header>
          <h1 className="text-3xl font-bold text-yellow-400">{title}</h1>
          <p className="text-zinc-300 mt-2">{intro}</p>
          <p className="text-xs text-zinc-500 mt-2">
            System status: {status?.overallStatus || "loading"} • Last updated:{" "}
            {status?.lastUpdatedAt || "-"}
          </p>
        </header>

        <Mini title="Common Issues" items={commonIssues} />
        <Mini title="Decision Guidance" items={decisionGuidance} />
        <Mini title="Real-World Scenarios" items={scenarios} />
        <Mini title="Step Hints Before Opening a Ticket" items={stepHints} />

        <section className="rounded border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="text-lg font-semibold text-yellow-300 mb-2">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((a) => (
              <Link
                key={a.href + a.label}
                href={a.href}
                className="px-3 py-2 rounded border border-zinc-700"
              >
                {a.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="text-lg font-semibold text-yellow-300 mb-2">
            Guided Help Actions
          </h2>
          <div className="flex flex-wrap gap-2">
            {guidedActions.map((a) => (
              <Link
                key={a.label}
                href={`/support/new?category=${encodeURIComponent(a.category)}&priority=${encodeURIComponent(a.priority || "Normal")}`}
                className="px-3 py-2 rounded border border-zinc-700"
              >
                {a.label}
              </Link>
            ))}
          </div>
        </section>

        <Mini title="Clear Next Actions" items={nextActions} />

        <section className="rounded border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="text-lg font-semibold text-yellow-300 mb-2">
            Escalation
          </h2>
          <div className="flex gap-2">
            <Link
              href="/support/new"
              className="px-3 py-2 rounded border border-zinc-700"
            >
              Open Ticket
            </Link>
            <Link
              href="/support/tickets"
              className="px-3 py-2 rounded border border-zinc-700"
            >
              My Tickets
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
