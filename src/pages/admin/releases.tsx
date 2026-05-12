import type { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

export default function ReleasesPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/admin/metrics/releases", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setRows(d.rows || []));
  }, []);
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-3">
        <h1 className="text-3xl font-bold text-yellow-400">
          Release Intelligence
        </h1>
        <div className="rounded border border-zinc-800 bg-zinc-950 p-4 overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-zinc-400">
                <th className="p-2 text-left">Commit</th>
                <th className="p-2 text-left">Deploy Date</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Route Checks</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any, i: number) => (
                <tr key={i} className="border-t border-zinc-800">
                  <td className="p-2">{r.commitHash || "-"}</td>
                  <td className="p-2">
                    {r.deployDate
                      ? new Date(r.deployDate).toLocaleString()
                      : "-"}
                  </td>
                  <td className="p-2">{r.status || "-"}</td>
                  <td className="p-2">{r.routeChecksResult || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps =
  requireAdminPageProps("/admin/releases");
