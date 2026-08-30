import type { ReactNode } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Coins,
  GraduationCap,
  NotebookTabs,
} from "lucide-react";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

const FEATURED_ARTICLES = [
  {
    title: "Financial Literacy 101",
    description:
      "Start with budgeting, credit, saving, and foundational wealth-building guidance.",
    href: "/financial-literacy",
    category: "Wealth",
  },
  {
    title: "How to Start a Black-Owned Business",
    description:
      "Move from idea to action with clearer direction into business setup and listing routes.",
    href: "/add-business",
    category: "Business",
  },
  {
    title: "Reclaiming Economic Power",
    description:
      "See how BWE frames circulation, support, and intentional community buying power.",
    href: "/1.8trillionimpact",
    category: "Economic context",
  },
  {
    title: "Building Generational Wealth",
    description:
      "Continue into long-horizon learning around ownership, investing, and asset growth.",
    href: "/courses/generational-wealth",
    category: "Learning",
  },
  {
    title: "Inclusive Hiring Practices",
    description:
      "Use employer guidance that makes hiring language, sourcing, and retention more intentional.",
    href: "/resources/inclusive-job-descriptions",
    category: "Hiring",
  },
  {
    title: "Circulating the Black Dollar",
    description:
      "Move from reading into action by discovering and supporting Black-owned businesses.",
    href: "/business-directory",
    category: "Discovery",
  },
] as const;

const ARTICLE_RAILS = [
  {
    title: "Learn money basics",
    copy: "Build stronger fundamentals before moving into premium coursework or business decisions.",
    href: "/financial-literacy",
  },
  {
    title: "Support Black businesses",
    copy: "Turn reading into discovery through the business directory and marketplace.",
    href: "/business-directory",
  },
  {
    title: "Grow your next move",
    copy: "Use BWE routes for jobs, opportunities, and learning when you are ready to act.",
    href: "/learning",
  },
] as const;

export default function GeneralArticlesPage() {
  const title = "Articles & Resources | Black Wealth Exchange";
  const description = truncateMeta(
    "Explore Black Wealth Exchange articles on financial literacy, entrepreneurship, hiring, and building generational wealth.",
  );
  const canonical = canonicalUrl("/resources/articles");
  const articleListSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: canonical,
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={canonicalUrl("/images/hero1.jpg")} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta
          name="twitter:image"
          content={canonicalUrl("/images/hero1.jpg")}
        />
      </Head>
      <script type="application/ld+json">
        {JSON.stringify(articleListSchema)}
      </script>

      <main className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
        <div className="absolute inset-0 bg-neutral-950" />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[760px] w-[760px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 left-[-8rem] h-[420px] w-[420px] rounded-full bg-sky-500/[0.04] blur-3xl" />

        <div className="bwe-section-wrap relative z-10 py-8 sm:py-10">
          <section className="bwe-hero-panel relative overflow-hidden rounded-[30px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_32%),radial-gradient(circle_at_82%_24%,rgba(255,255,255,0.08),transparent_24%)]" />

            <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.06fr)_minmax(0,0.94fr)] lg:items-end">
              <div className="max-w-3xl">
                <div className="bwe-eyebrow">Articles</div>
                <h1 className="bwe-display-title mt-3 max-w-[11ch]">
                  Read, learn, then move into action.
                </h1>
                <p className="bwe-lead mt-4 max-w-2xl">
                  This library brings together BWE learning, economic context,
                  and practical business guidance in a cleaner scanning flow.
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/learning"
                    className="bwe-cta-primary bwe-focus-ring px-6"
                  >
                    Open learning hub
                  </Link>
                  <Link
                    href="/resources"
                    className="bwe-cta-secondary bwe-focus-ring px-6"
                  >
                    Back to resources
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <MiniSignal
                  icon={<Coins className="h-4 w-4" />}
                  title="Wealth"
                  copy="Financial literacy, circulation, and generational wealth context."
                />
                <MiniSignal
                  icon={<BriefcaseBusiness className="h-4 w-4" />}
                  title="Business"
                  copy="Business-building and hiring guidance connected to live platform routes."
                />
                <MiniSignal
                  icon={<GraduationCap className="h-4 w-4" />}
                  title="Learning"
                  copy="Clear handoffs into public learning and premium education routes."
                />
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="grid gap-4 sm:grid-cols-2">
              {FEATURED_ARTICLES.map((article, index) => (
                <Link
                  key={article.href}
                  href={article.href}
                  className={`group rounded-[28px] border px-5 py-5 transition hover:-translate-y-0.5 ${
                    index === 0
                      ? "border-[rgba(212,175,55,0.28)] bg-[rgba(212,175,55,0.08)]"
                      : "border-white/8 bg-white/[0.03] hover:border-[rgba(212,175,55,0.22)] hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                    {article.category}
                  </div>
                  <h2 className="mt-3 text-[1.2rem] font-semibold tracking-[-0.03em] text-white">
                    {article.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-white/64">
                    {article.description}
                  </p>
                  <div className="mt-5 flex items-center gap-2 text-sm font-medium text-[var(--accent)]">
                    <span>Open route</span>
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>

            <aside className="grid gap-4">
              <section className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5 sm:p-6">
                <div className="bwe-eyebrow">Recommended paths</div>
                <h2 className="mt-3 text-[1.35rem] font-semibold tracking-[-0.03em] text-white">
                  Keep the next step obvious.
                </h2>
                <div className="mt-5 space-y-3">
                  {ARTICLE_RAILS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-2xl border border-white/8 bg-black/20 px-4 py-4 transition hover:border-[rgba(212,175,55,0.3)] hover:bg-white/[0.04]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-white/88">
                          {item.title}
                        </div>
                        <ArrowRight className="h-4 w-4 text-[var(--accent)]" />
                      </div>
                      <p className="mt-2 text-sm leading-6 text-white/60">
                        {item.copy}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="bwe-soft-tile p-5">
                <div className="flex items-center gap-2 text-[var(--accent)]">
                  <NotebookTabs className="h-4 w-4" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                    Library intent
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/64">
                  The article library is now lighter to scan on desktop and
                  mobile, with clearer separation between reading, learning, and
                  action-oriented routes.
                </p>
              </section>
            </aside>
          </section>
        </div>
      </main>
    </>
  );
}

function MiniSignal({
  icon,
  title,
  copy,
}: {
  icon: ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
      <div className="flex items-center gap-2 text-[var(--accent)]">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
          {title}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-white/64">{copy}</p>
    </div>
  );
}
