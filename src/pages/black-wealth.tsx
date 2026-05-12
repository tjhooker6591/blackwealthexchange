import Head from "next/head";
import Link from "next/link";
import { canonicalUrl, getBaseUrl, truncateMeta } from "@/lib/seo";

const TOPICS = [
  {
    title: "Find Black-owned businesses near you",
    description:
      "Use BWE Directory and Travel Map to discover trusted Black-owned businesses by category, city, and state.",
    href: "/black-owned-businesses",
    anchor: "browse Black-owned businesses by state",
  },
  {
    title: "Build wealth with practical money workflows",
    description:
      "Track transactions, budget, debt payoff, and savings goals from one connected Wealth Builder experience.",
    href: "/wealth-builder",
    anchor: "use the Wealth Builder dashboard",
  },
  {
    title: "Move into higher-income opportunities",
    description:
      "Explore jobs, employer pathways, and consultant services designed for practical economic mobility.",
    href: "/recruiting-consulting",
    anchor: "explore consultant and hiring pathways",
  },
];

export default function BlackWealthPage() {
  const canonical = canonicalUrl("/black-wealth");
  const base = getBaseUrl().replace(/\/$/, "");
  const title = "Black Wealth Guide | Black Wealth Exchange";
  const description = truncateMeta(
    "Learn practical ways to build Black wealth through business circulation, jobs, consulting pathways, and personal finance systems inside Black Wealth Exchange.",
  );

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Black Wealth Guide",
    about: ["Black wealth", "economic mobility", "Black-owned businesses"],
    mainEntityOfPage: canonical,
    author: {
      "@type": "Organization",
      name: "Black Wealth Exchange",
    },
    publisher: {
      "@type": "Organization",
      name: "Black Wealth Exchange",
      logo: {
        "@type": "ImageObject",
        url: `${base}/favicon.png`,
      },
    },
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta
          name="robots"
          content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1"
        />
        <link rel="canonical" href={canonical} />
      </Head>

      <script type="application/ld+json">
        {JSON.stringify(articleSchema)}
      </script>

      <main className="min-h-screen bg-black px-6 py-12 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-300">
            Black Wealth Guide
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Practical paths to build Black wealth
          </h1>
          <p className="mt-4 max-w-3xl text-base text-zinc-300">
            Black wealth grows when circulation, ownership, earnings, and
            systems work together. This guide focuses on action: find
            Black-owned businesses, increase income pathways, and run a personal
            money system that compounds over time.
          </p>

          <section className="mt-8 grid gap-4 md:grid-cols-3">
            {TOPICS.map((topic) => (
              <article
                key={topic.title}
                className="rounded-2xl border border-white/10 bg-zinc-950 p-4"
              >
                <h2 className="text-lg font-semibold text-yellow-200">
                  {topic.title}
                </h2>
                <p className="mt-2 text-sm text-zinc-300">
                  {topic.description}
                </p>
                <Link
                  href={topic.href}
                  className="mt-4 inline-block text-sm font-semibold text-yellow-300 underline underline-offset-4"
                >
                  {topic.anchor}
                </Link>
              </article>
            ))}
          </section>

          <section className="mt-10 rounded-2xl border border-white/10 bg-zinc-950 p-5">
            <h2 className="text-2xl font-bold">
              How Black Wealth Exchange helps
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-zinc-300">
              <li>
                Directory + Travel Map for trusted business discovery and local
                economic circulation.
              </li>
              <li>
                Wealth Builder for monthly cash-flow clarity, debt reduction,
                and savings momentum.
              </li>
              <li>
                Consultant and employer workflows to improve access to real
                opportunities.
              </li>
              <li>
                Search-first platform design so users can move from intent to
                action quickly.
              </li>
            </ul>

            <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/job-listings"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm hover:border-yellow-400/40"
              >
                Black jobs and careers
              </Link>
              <Link
                href="/black-student-opportunities"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm hover:border-yellow-400/40"
              >
                Black internships and student opportunities
              </Link>
              <Link
                href="/financial-literacy"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm hover:border-yellow-400/40"
              >
                Black financial literacy resources
              </Link>
              <Link
                href="/marketplace"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm hover:border-yellow-400/40"
              >
                Black marketplace discovery
              </Link>
              <Link
                href="/business-directory"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm hover:border-yellow-400/40"
              >
                Black business directory search
              </Link>
              <Link
                href="/travel-map/explore"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm hover:border-yellow-400/40"
              >
                Travel Map discovery
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
