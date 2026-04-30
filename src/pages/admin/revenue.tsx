import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { requireAdminPageProps } from "@/lib/adminPageGuard";


const adminNavLinks = [
  ["Command Center", "/admin/command-center"],
  ["Financial Review", "/admin/financial-review"],
  ["Dashboard", "/admin/dashboard"],
  ["Support", "/admin/support"],
  ["Revenue", "/admin/revenue"],
  ["Growth", "/admin/growth"],
  ["Partnerships", "/admin/partnerships"],
] as const;

function AdminHubNav() {
  return (
    <div className="flex flex-wrap gap-2">
      {adminNavLinks.map(([label, href]) => (
        <Link key={href} href={href} className="text-xs border border-zinc-700 px-3 py-1.5 rounded">
          {label}
        </Link>
      ))}
    </div>
  );
}
export default function Page() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <AdminHubNav />

        {router.query.source === "command-center" ? (
          <div className="rounded border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">
            Opened from Command Center{router.query.focus ? ` • Focus: ${String(router.query.focus)}` : ""}
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-yellow-400">
            Revenue Operations
          </h1>
          <Link
            href="/admin/dashboard"
            className="text-sm border border-zinc-700 px-3 py-2 rounded"
          >
            Back to Admin
          </Link>
        </div>
        <div className="rounded border border-zinc-800 bg-zinc-950 p-4">
          <div className="text-sm mb-2">
            <Link href="/admin/financial-review?source=command-center&focus=revenue" className="underline text-yellow-300">Go to → Financial Review</Link>
          </div>
          <p className="text-zinc-300">Not connected yet</p>
        </div>
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps =
  requireAdminPageProps("/admin/revenue");
