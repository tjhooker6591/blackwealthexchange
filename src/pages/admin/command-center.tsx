import type { GetServerSideProps } from "next";
import Link from "next/link";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

const cards = [
  "Company health",
  "Revenue health",
  "Support health",
  "Product/engineering health",
  "Release status",
  "Growth status",
  "Trust & safety status",
  "Top 3 executive priorities",
  "Decisions needed",
  "Blockers",
  "Go / No-Go status",
];

export default function CommandCenterPage() {
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-yellow-400">CEO Command Center</h1>
          <div className="flex gap-2">
            <Link href="/admin/financial-review" className="text-sm border border-zinc-700 px-3 py-2 rounded">Financial Review</Link>
            <Link href="/admin/support-review" className="text-sm border border-zinc-700 px-3 py-2 rounded">Support Review</Link>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {cards.map((c)=> (
            <div key={c} className="rounded border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-yellow-300 font-semibold">{c}</div>
              <div className="text-zinc-400 text-sm mt-1">Not connected yet</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = requireAdminPageProps("/admin/command-center");
