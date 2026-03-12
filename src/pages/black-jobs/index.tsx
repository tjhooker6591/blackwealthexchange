import Head from "next/head";
import Link from "next/link";
import { canonicalUrl, truncateMeta } from "@/lib/seo";
import { JOB_NICHES } from "@/lib/seoLanding";

export default function BlackJobsHub() {
  const title = "Black Jobs & Career Opportunities | Black Wealth Exchange";
  const description = truncateMeta("Explore Black job opportunities by niche, discover hiring pathways, and connect with inclusive employers.");
  const canonical = canonicalUrl("/black-jobs");

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "Where can I find Black career opportunities?", acceptedAnswer: { "@type": "Answer", text: "Use Black Wealth Exchange job listings and niche hubs to find roles aligned with your career path." } },
      { "@type": "Question", name: "Can employers post jobs for Black professionals?", acceptedAnswer: { "@type": "Answer", text: "Yes. Employers can post jobs and reach candidates through BWE hiring channels." } },
    ],
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8">
      <Head><title>{title}</title><meta name="description" content={description} /><link rel="canonical" href={canonical} /></Head>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h1 className="text-3xl font-extrabold text-[#D4AF37]">Black jobs and career opportunities</h1>
          <p className="mt-2 text-white/80">Search Black career paths by niche and move from browsing to application faster.</p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link href="/job-listings" className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10">Browse live job listings</Link>
            <Link href="/jobs" className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10">Jobs and career hub</Link>
          </div>
        </header>
        <section>
          <h2 className="text-xl font-bold mb-3">Job niches</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {JOB_NICHES.map((n) => (
              <Link key={n} href={`/black-jobs/${n}`} className="rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10">Black {n} jobs</Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
