import type { GetServerSideProps } from "next";
import { requireAdminPageProps } from "@/lib/adminPageGuard";
import { useEffect, useState } from "react";

export default function SupportReviewPage() {
  const [d, setD] = useState<any>(null);
  useEffect(() => {
    fetch("/api/admin/support-review", { credentials: "include" })
      .then((r) => r.json())
      .then(setD);
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold text-yellow-400">
          Admin Support Review
        </h1>
        {!d ? (
          "Loading..."
        ) : (
          <>
            <div className="grid md:grid-cols-4 gap-3">
              {Object.entries(d.metrics || {}).map(([k, v]: any) => (
                <div
                  key={k}
                  className="rounded border border-zinc-800 bg-zinc-950 p-3"
                >
                  <div className="text-xs text-zinc-400">{k}</div>
                  <div className="text-2xl font-bold text-yellow-300">
                    {String(v)}
                  </div>
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <pre className="rounded border border-zinc-800 bg-zinc-950 p-3 text-xs overflow-auto">
                By Category\n{JSON.stringify(d.ticketsByCategory, null, 2)}
              </pre>
              <pre className="rounded border border-zinc-800 bg-zinc-950 p-3 text-xs overflow-auto">
                By Status\n{JSON.stringify(d.ticketsByStatus, null, 2)}
              </pre>
              <pre className="rounded border border-zinc-800 bg-zinc-950 p-3 text-xs overflow-auto">
                By Priority\n{JSON.stringify(d.ticketsByPriority, null, 2)}
              </pre>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <pre className="rounded border border-zinc-800 bg-zinc-950 p-3 text-xs overflow-auto">
                Recent Escalations\n
                {JSON.stringify(d.recentEscalations, null, 2)}
              </pre>
              <pre className="rounded border border-zinc-800 bg-zinc-950 p-3 text-xs overflow-auto">
                Repeat Issue Patterns\n
                {JSON.stringify(d.repeatIssuePatterns, null, 2)}
              </pre>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = requireAdminPageProps(
  "/admin/support-review",
);
