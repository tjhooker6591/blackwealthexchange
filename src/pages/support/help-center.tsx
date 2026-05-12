import Link from "next/link";
export default function Page() {
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-5xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold text-yellow-400">Support</h1>
        <p className="text-zinc-300">BWE support page.</p>
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
