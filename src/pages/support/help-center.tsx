import Link from "next/link";
import Head from "next/head";
import { canonicalUrl, truncateMeta } from "@/lib/seo";
export default function Page() {
  return (
    <>
      <Head>
        <title>Help Center | Black Wealth Exchange</title>
        <meta
          name="description"
          content={truncateMeta(
            "Use the Black Wealth Exchange help center to open support tickets, check ticket status, and move into the right support path quickly.",
          )}
        />
        <link rel="canonical" href={canonicalUrl("/support/help-center")} />
      </Head>
      <main className="min-h-screen bg-black text-white p-8">
        <div className="max-w-5xl mx-auto space-y-4">
          <h1 className="text-3xl font-bold text-yellow-400">Help Center</h1>
          <p className="text-zinc-300">
            Start here when you need help choosing the right support path,
            opening a ticket, or reviewing your existing support activity.
          </p>
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
    </>
  );
}
