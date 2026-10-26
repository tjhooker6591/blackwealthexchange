import Head from "next/head";
import InquiryForm from "@/components/inquiries/InquiryForm";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

export default function Page() {
  return (
    <>
      <Head>
        <title>Contact | Black Wealth Exchange</title>
        <meta
          name="description"
          content={truncateMeta(
            "Contact Black Wealth Exchange about your business listing, the business membership, advertising, AI training and consulting, finding a Black-owned business, or partnerships.",
          )}
        />
        <link rel="canonical" href={canonicalUrl("/contact")} />
      </Head>
      <main className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
        <div className="pointer-events-none absolute -top-28 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
        <div className="bwe-section-wrap relative z-10 py-8 sm:py-10">
          <section className="bwe-hero-panel relative overflow-hidden rounded-[30px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <div className="relative max-w-3xl">
              <div className="bwe-eyebrow">Contact</div>
              <h1 className="bwe-display-title mt-3 max-w-[14ch]">
                Contact Black Wealth Exchange
              </h1>
              <p className="bwe-lead mt-4 max-w-2xl">
                Tell us what you need. You&apos;ll get an email reply right away, and
                business inquiries are followed up personally by our team.
              </p>
            </div>
          </section>
          <section className="relative mt-8 rounded-[30px] border border-white/8 bg-white/[0.03] p-4 sm:p-6">
            <InquiryForm />
          </section>
        </div>
      </main>
    </>
  );
}
