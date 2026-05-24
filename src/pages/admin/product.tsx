import type { GetServerSideProps } from "next";
import Link from "next/link";
import { requireAdminPageProps } from "@/lib/adminPageGuard";

export default function Page() {
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-yellow-400">
            Product Operations
          </h1>
          <Link
            href="/admin/dashboard"
            className="text-sm border border-zinc-700 px-3 py-2 rounded"
          >
            Back to Admin
          </Link>
        </div>
        <div className="rounded border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-zinc-300">Not connected yet</p>
        </div>
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps =
  requireAdminPageProps("/admin/product");
