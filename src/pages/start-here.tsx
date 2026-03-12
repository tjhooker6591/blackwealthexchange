import Head from "next/head";
import Link from "next/link";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

const ROLES = [
  {
    title: "Buyer / Shopper",
    summary: "Find trusted Black-owned products and businesses, then buy with confidence.",
    primary: { href: "/marketplace", label: "Shop Black-owned products" },
    secondary: { href: "/business-directory", label: "Find Black-owned businesses near me" },
  },
  {
    title: "Business Owner (Directory)",
    summary: "Get your business discovered by customers actively looking to support Black-owned companies.",
    primary: { href: "/business-directory/add-business", label: "Get listed in directory" },
    secondary: { href: "/trust", label: "Review trust & policy standards" },
  },
  {
    title: "Seller (Marketplace)",
    summary: "Launch products, get discovered, and start selling through BWE marketplace pathways.",
    primary: { href: "/marketplace/become-a-seller", label: "Start selling on BWE" },
    secondary: { href: "/marketplace", label: "See marketplace first" },
  },
  {
    title: "Employer",
    summary: "Post jobs and connect with talent aligned with your company and mission.",
    primary: { href: "/post-job", label: "Post a job" },
    secondary: { href: "/black-jobs", label: "View jobs discovery hub" },
  },
  {
    title: "Job Seeker / Talent",
    summary: "Explore roles, filter by niche, and continue your job search journey in one place.",
    primary: { href: "/job-listings", label: "Browse live jobs" },
    secondary: { href: "/black-jobs", label: "Explore job niches" },
  },
];

export default function StartHerePage() {
  const title = "Start Here | Black Wealth Exchange";
  const description = truncateMeta(
    "Choose your path on Black Wealth Exchange: shop, get listed, sell products, post jobs, or find career opportunities.",
  );
  const canonical = canonicalUrl("/start-here");

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
      </Head>

      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h1 className="text-3xl font-extrabold text-[#D4AF37]">Start Here</h1>
          <p className="mt-2 max-w-3xl text-white/80">
            Choose the path that matches your goal. Each flow is designed to get
            you to value quickly with clear next steps.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ROLES.map((role) => (
            <article key={role.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-bold text-white">{role.title}</h2>
              <p className="mt-2 text-sm text-white/75">{role.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={role.primary.href} className="rounded-lg bg-[#D4AF37] px-3 py-2 text-sm font-bold text-black hover:bg-yellow-400">
                  {role.primary.label}
                </Link>
                <Link href={role.secondary.href} className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10">
                  {role.secondary.label}
                </Link>
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/75">
          Already have an account? <Link href="/login" className="text-[#D4AF37] underline">Log in</Link>.
          New here? <Link href="/signup" className="text-[#D4AF37] underline">Create an account</Link>.
        </section>
      </div>
    </main>
  );
}
