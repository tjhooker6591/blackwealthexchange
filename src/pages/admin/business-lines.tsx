import type { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

export default function Page() {
  const [d, setD] = useState<any>(null);
  useEffect(() => {
    fetch("/api/admin/metrics/business-lines", { credentials: "include" })
      .then((r) => r.json())
      .then(setD);
  }, []);
  if (!d)
    return (
      <main className="min-h-screen bg-black text-white p-8">Loading...</main>
    );
  const block = (title: string, obj: any) => (
    <div className="rounded border border-zinc-800 bg-zinc-950 p-4">
      <h2 className="text-yellow-300 font-semibold mb-2">{title}</h2>
      <pre className="text-xs text-zinc-300 overflow-auto">
        {JSON.stringify(obj, null, 2)}
      </pre>
    </div>
  );
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-3">
        <h1 className="text-3xl font-bold text-yellow-400">Business Lines</h1>
        <div className="grid md:grid-cols-2 gap-3">
          {block("BWE Core Platform", d.core)}
          {block("BWE Growth & Revenue", d.growthRevenue)}
          {block("BWE Creator & Media", d.creatorMedia)}
          {block("BWE Future Bets", d.futureBets)}
        </div>
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = requireAdminPageProps(
  "/admin/business-lines",
);
