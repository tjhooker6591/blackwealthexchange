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
      <main className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
        <div className="absolute inset-0 bg-neutral-950" />
        <div className="pointer-events-none absolute -top-28 left-1/2 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />

        <div className="bwe-section-wrap relative z-10 py-8 sm:py-10">
          <section className="bwe-hero-panel relative overflow-hidden rounded-[30px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.08),transparent_24%)]" />
            <div className="relative max-w-3xl">
              <div className="bwe-eyebrow">Support</div>
              <h1 className="bwe-display-title mt-3 max-w-[11ch]">
                Open a support ticket with the right context.
              </h1>
              <p className="bwe-lead mt-4 max-w-2xl">
                Billing and security categories route with higher urgency. Add
                links, IDs, and clear repro context when you have them.
              </p>
            </div>
          </section>

          <section className="mt-8 rounded-[30px] border border-white/8 bg-white/[0.03] p-4 sm:p-6">
            <SupportTicketForm />
          </section>
        </div>
      </main>
    </>
  );
}
