import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { canonicalUrl, truncateMeta } from "@/lib/seo";
import { JOB_NICHES } from "@/lib/seoLanding";

type Job = { _id: string; title?: string; company?: string; location?: string; description?: string };
type Props = { niche: string; jobs: Job[] };

function esc(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const nicheRaw = String(Array.isArray(ctx.params?.niche) ? ctx.params?.niche[0] : ctx.params?.niche || "").toLowerCase();
  const niche = JOB_NICHES.includes(nicheRaw) ? nicheRaw : "technology";

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const q = {
      $or: [
        { title: { $regex: new RegExp(esc(niche), "i") } },
        { description: { $regex: new RegExp(esc(niche), "i") } },
        { category: { $regex: new RegExp(esc(niche), "i") } },
      ],
    } as any;

    const rows = await db.collection("jobs").find(q).project({ title: 1, company: 1, location: 1, description: 1 }).limit(20).toArray();
    const jobs = rows.map((r: any) => ({ _id: String(r._id), title: r.title, company: r.company, location: r.location, description: r.description }));
    return { props: { niche, jobs } };
  } catch {
    return { props: { niche, jobs: [] } };
  }
};

export default function BlackJobsNichePage({ niche, jobs }: Props) {
  const title = `Black ${niche} jobs | Black Wealth Exchange`;
  const description = truncateMeta(`Find Black ${niche} job opportunities, employer pathways, and career growth routes on Black Wealth Exchange.`);
  const canonical = canonicalUrl(`/black-jobs/${niche}`);

  const jobSchema = jobs.slice(0, 8).map((job) => ({
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title || `Black ${niche} role`,
    description: (job.description || `Apply for Black ${niche} opportunities through Black Wealth Exchange.`).slice(0, 500),
    hiringOrganization: {
      "@type": "Organization",
      name: job.company || "Hiring Organization",
    },
    jobLocation: job.location
      ? {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: job.location,
          },
        }
      : undefined,
  }));

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8">
      <Head><title>{title}</title><meta name="description" content={description} /><link rel="canonical" href={canonical} /></Head>
      {jobSchema.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h1 className="text-3xl font-extrabold text-[#D4AF37]">Black {niche} jobs</h1>
          <p className="mt-2 text-white/80">Focused career discovery for {niche} roles with pathways to application and growth.</p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link href="/black-jobs" className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10">All job niches</Link>
            <Link href={`/job-listings?search=${encodeURIComponent(niche)}`} className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10">Search live listings for {niche}</Link>
          </div>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          {jobs.length ? (
            <ul className="space-y-3">
              {jobs.map((j) => (
                <li key={j._id} className="border-b border-white/10 pb-2">
                  <Link href="/job-listings" className="font-semibold hover:text-[#D4AF37]">{j.title || `Black ${niche} role`}</Link>
                  <p className="text-sm text-white/70">{j.company || "Employer"}{j.location ? ` • ${j.location}` : ""}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-white/70">No niche-specific jobs surfaced yet. Continue with live listings and expand your search terms.</p>
          )}
        </section>
      </div>
    </div>
  );
}
