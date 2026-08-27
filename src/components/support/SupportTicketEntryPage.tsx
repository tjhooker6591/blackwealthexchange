import Head from "next/head";
import SupportTicketForm from "@/components/support/SupportTicketForm";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

export default function SupportTicketEntryPage({
  title,
  intro,
  metaTitle,
  metaDescription,
  canonicalPath,
  defaultCategory,
}: {
  title: string;
  intro: string;
  metaTitle: string;
  metaDescription: string;
  canonicalPath: string;
  defaultCategory?: string;
}) {
  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={truncateMeta(metaDescription)} />
        <link rel="canonical" href={canonicalUrl(canonicalPath)} />
      </Head>
      <main className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
        <div className="absolute inset-0 bg-neutral-950" />
        <div className="pointer-events-none absolute -top-28 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />

        <div className="bwe-section-wrap relative z-10 py-8 sm:py-10">
          <section className="bwe-hero-panel relative overflow-hidden rounded-[30px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.08),transparent_24%)]" />
            <div className="relative max-w-3xl">
              <div className="bwe-eyebrow">Support</div>
              <h1 className="bwe-display-title mt-3 max-w-[12ch]">{title}</h1>
              <p className="bwe-lead mt-4 max-w-2xl">{intro}</p>
            </div>
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="rounded-[26px] border border-[rgba(212,175,55,0.24)] bg-[rgba(212,175,55,0.08)] p-5 sm:p-6">
              <div className="bwe-eyebrow">Before you submit</div>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-white/72">
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                  <span>
                    Use the closest category so support can route the request
                    faster.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                  <span>
                    Include order IDs, listing IDs, URLs, or screenshots when
                    available.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                  <span>
                    Security and billing issues should use the most accurate
                    urgency level.
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5 sm:p-6">
              <div className="bwe-eyebrow">What happens next</div>
              <p className="mt-4 text-sm leading-6 text-white/68">
                Your request is saved to the support queue, triaged by category
                and priority, and then surfaced back in the ticket center for
                follow-up.
              </p>
            </div>
          </section>

          <section className="mt-8 rounded-[30px] border border-white/8 bg-white/[0.03] p-4 sm:p-6">
            <SupportTicketForm defaultCategory={defaultCategory} />
          </section>
        </div>
      </main>
    </>
  );
}
