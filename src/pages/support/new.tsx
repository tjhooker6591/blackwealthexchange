import SupportTicketForm from "@/components/support/SupportTicketForm";
import Head from "next/head";
import { canonicalUrl, truncateMeta } from "@/lib/seo";
export default function NewSupport() {
  return (
    <>
      <Head>
        <title>Open Support Ticket | Black Wealth Exchange</title>
        <meta
          name="description"
          content={truncateMeta(
            "Open a Black Wealth Exchange support ticket for billing, security, marketplace, directory, employer, or general account issues.",
          )}
        />
        <link rel="canonical" href={canonicalUrl("/support/new")} />
      </Head>
      <main className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <h1 className="text-3xl font-bold text-yellow-400">
            Open Support Ticket
          </h1>
          <p className="text-zinc-300">
            Billing/security categories auto-tag higher priority.
          </p>
          <SupportTicketForm />
        </div>
      </main>
    </>
  );
}
