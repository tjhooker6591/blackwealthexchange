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
      <main className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
        <div className="absolute inset-0 bg-neutral-950" />
        <div className="pointer-events-none absolute -top-28 left-1/2 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />

        <div className="bwe-section-wrap relative z-10 py-8 sm:py-10">
          <section className="bwe-hero-panel relative overflow-hidden rounded-[30px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.08),transparent_24%)]" />
            <div className="relative max-w-3xl">
              <div className="bwe-eyebrow">Help center</div>
              <h1 className="bwe-display-title mt-3 max-w-[10ch]">
                Choose the right support path quickly.
              </h1>
              <p className="bwe-lead mt-4 max-w-2xl">
                Start here when you need help opening a ticket, reviewing your
                existing support activity, or finding the correct support lane.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/support/new"
                  className="bwe-cta-primary bwe-focus-ring px-6"
                >
                  Open ticket
                </Link>
                <Link
                  href="/support/tickets"
                  className="bwe-cta-secondary bwe-focus-ring px-6"
                >
                  My tickets
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
