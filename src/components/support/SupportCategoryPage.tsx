import Link from "next/link";
import { useEffect, useState } from "react";

type Item = { label: string; href: string };

export default function SupportCategoryPage({
  title,
  intro,
  commonIssues,
  quickActions,
  guidedActions,
}: {
  title: string;
  intro: string;
  commonIssues: string[];
  quickActions: Item[];
  guidedActions: { label: string; category: string; priority?: string }[];
}) {
  const [status, setStatus] = useState<any>(null);
  useEffect(() => {
    fetch("/api/support/status").then((r) => r.json()).then(setStatus).catch(() => null);
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-yellow-400">{title}</h1>
          <p className="text-zinc-300 mt-2">{intro}</p>
          <p className="text-xs text-zinc-500 mt-2">System status: {status?.overallStatus || "loading"} • Last updated: {status?.lastUpdatedAt || "-"}</p>
        </header>

        <section className="rounded border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="text-xl font-semibold text-yellow-300 mb-2">Common Issues</h2>
          <ul className="list-disc pl-5 space-y-1 text-zinc-200">{commonIssues.map((x) => <li key={x}>{x}</li>)}</ul>
        </section>

        <section className="rounded border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="text-xl font-semibold text-yellow-300 mb-2">Quick Actions</h2>
          <div className="flex flex-wrap gap-2">{quickActions.map((a) => <Link key={a.href + a.label} href={a.href} className="px-3 py-2 rounded border border-zinc-700">{a.label}</Link>)}</div>
        </section>

        <section className="rounded border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="text-xl font-semibold text-yellow-300 mb-2">Guided Help Actions</h2>
          <div className="flex flex-wrap gap-2">{guidedActions.map((a) => <Link key={a.label} href={`/support/new?category=${encodeURIComponent(a.category)}&priority=${encodeURIComponent(a.priority || "Normal")}`} className="px-3 py-2 rounded border border-zinc-700">{a.label}</Link>)}</div>
        </section>

        {status?.incidentTimeline?.length ? (
          <section className="rounded border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-xl font-semibold text-yellow-300 mb-2">Known Issues</h2>
            <ul className="text-sm text-zinc-300 space-y-1">{status.incidentTimeline.slice(0, 5).map((i: any, idx: number) => <li key={idx}>• {i.component || i.service || "system"}: {i.status || "update"}</li>)}</ul>
          </section>
        ) : null}

        <section className="rounded border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="text-xl font-semibold text-yellow-300 mb-2">Escalation</h2>
          <div className="flex gap-2">
            <Link href="/support/new" className="px-3 py-2 rounded border border-zinc-700">Open Ticket</Link>
            <Link href="/support/tickets" className="px-3 py-2 rounded border border-zinc-700">My Tickets</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
