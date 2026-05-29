import Link from "next/link";
import { useEffect, useState } from "react";

type StatusPayload = {
  overallStatus?: string;
  lastUpdatedAt?: string;
  typicalResponseTimeHours?: number | null;
  services?: Record<string, string>;
};

export default function Page() {
  const [status, setStatus] = useState<StatusPayload | null>(null);

  useEffect(() => {
    fetch("/api/support/status")
      .then((r) => r.json())
      .then((d) => setStatus(d || null))
      .catch(() => setStatus(null));
  }, []);

  const state = status?.overallStatus || "operational";
  const stateTone =
    state === "operational"
      ? "text-emerald-300"
      : state === "degraded"
        ? "text-yellow-300"
        : "text-red-300";

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold text-yellow-400">System Status</h1>
        <p className={`text-sm ${stateTone}`}>● {state}</p>
        <p className="text-zinc-300 text-sm">
          Last updated:{" "}
          {status?.lastUpdatedAt
            ? new Date(status.lastUpdatedAt).toLocaleString()
            : "live"}
          {" • "}Typical response time:{" "}
          {status?.typicalResponseTimeHours != null
            ? `${status.typicalResponseTimeHours}h`
            : "not enough recent ticket data"}
        </p>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="text-yellow-300 font-semibold mb-2">Service health</h2>
          <ul className="space-y-1 text-sm text-zinc-200">
            {Object.entries(status?.services || {}).map(([name, value]) => (
              <li key={name}>
                {name}: {value}
              </li>
            ))}
          </ul>
        </div>

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
      </div>
    </main>
  );
}
