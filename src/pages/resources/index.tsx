import type { ReactNode } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CircleCheck,
  Compass,
} from "lucide-react";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

const RESOURCE_TRACKS = [
  {
    title: "Hiring foundations",
    copy: "Practical guidance for writing roles, improving outreach, and building fairer hiring systems.",
    href: "/resources/inclusive-job-descriptions",
    label: "Read the featured guide",
  },
  {
    title: "Article library",
    copy: "Browse public articles on financial literacy, business growth, and economic participation across BWE.",
    href: "/resources/articles",
    label: "Open article library",
  },
  {
    title: "Employer actions",
    copy: "Move from guidance into live routes for hiring, posting opportunities, and supporting Black talent.",
    href: "/jobs",
    label: "View jobs and hiring paths",
  },
] as const;

const RESOURCE_SIGNALS = [
  "Public learning and employer guidance",
  "Clear routes into learning and action",
  "Mobile-friendly scanning and next steps",
] as const;

const QUICK_LINKS = [
  { href: "/financial-literacy", label: "Financial literacy" },
  { href: "/business-directory", label: "Business directory" },
  { href: "/jobs", label: "Jobs" },
  { href: "/black-student-opportunities", label: "Student opportunities" },
] as const;

export default function ResourcesIndex() {
  const title = "Resources | Black Wealth Exchange";
  const description = truncateMeta(
    "Explore Black Wealth Exchange resources with clearer employer guidance, public learning paths, and article discovery.",
  );
  const canonical = canonicalUrl("/resources");
  const collectionSchema = {
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
        {JSON.stringify(collectionSchema)}
      </script>

      <main className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
        <div className="absolute inset-0 bg-neutral-950" />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[740px] w-[740px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-44 right-[-8rem] h-[420px] w-[420px] rounded-full bg-emerald-500/[0.04] blur-3xl" />

        <div className="bwe-section-wrap relative z-10 py-8 sm:py-10">
          <section className="bwe-hero-panel relative overflow-hidden rounded-[30px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_32%),radial-gradient(circle_at_85%_18%,rgba(255,255,255,0.08),transparent_24%)]" />

            <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-end">
              <div className="max-w-3xl">
                <div className="bwe-eyebrow">Resources</div>
                <h1 className="bwe-display-title mt-3 max-w-[12ch]">
                  Find practical guidance and clear next steps.
                </h1>
                <p className="bwe-lead mt-4 max-w-2xl">
                  Browse public articles, hiring guidance, and BWE learning
                  routes without digging through promotional copy or dead ends.
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/resources/articles"
                    className="bwe-cta-primary bwe-focus-ring px-6"
                  >
                    Browse articles
                  </Link>
                  <Link
                    href="/resources/inclusive-job-descriptions"
                    className="bwe-cta-secondary bwe-focus-ring px-6"
                  >
                    Featured hiring guide
                  </Link>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {RESOURCE_SIGNALS.map((item, index) => (
                    <span
                      key={item}
                      className="bwe-badge"
                      data-tone={index === 0 ? "accent" : undefined}
                    >
                      <CircleCheck className="h-4 w-4" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <SignalTile
                  icon={<BookOpen className="h-4 w-4" />}
                  title="Read"
                  copy="Start with public articles and practical resource pages."
                />
                <SignalTile
                  icon={<BriefcaseBusiness className="h-4 w-4" />}
                  title="Apply"
                  copy="Move from guidance into jobs, directory discovery, and live BWE routes."
                />
                <SignalTile
                  icon={<Compass className="h-4 w-4" />}
                  title="Continue"
                  copy="Use each page as a launch point into deeper learning or platform action."
                />
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
            <div className="grid gap-4">
              {RESOURCE_TRACKS.map((track, index) => (
                <article
                  key={track.href}
                  className={`rounded-[28px] border px-5 py-5 sm:px-6 ${
                    index === 0
                      ? "border-[rgba(212,175,55,0.28)] bg-[rgba(212,175,55,0.08)]"
                      : "border-white/8 bg-white/[0.03]"
                  }`}
                >
                  <div className="bwe-eyebrow">{track.title}</div>
                  <h2 className="bwe-section-title mt-3 max-w-[18ch] text-[1.7rem] sm:text-[1.9rem]">
                    {track.copy}
                  </h2>
                  <div className="mt-5">
                    <Link
                      href={track.href}
                      className="bwe-open-link bwe-focus-ring text-sm text-white/86"
                    >
                      {track.label}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <aside className="grid gap-4">
              <section className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5 sm:p-6">
                <div className="bwe-eyebrow">Quick routes</div>
                <h2 className="mt-3 text-[1.35rem] font-semibold tracking-[-0.03em] text-white">
                  Go straight to the area you need.
                </h2>
                <div className="mt-5 space-y-3">
                  {QUICK_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex min-h-12 items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 text-sm font-medium text-white/86 transition hover:border-[rgba(212,175,55,0.3)] hover:bg-white/[0.04]"
                    >
                      <span>{link.label}</span>
                      <ArrowRight className="h-4 w-4 text-[var(--accent)]" />
                    </Link>
                  ))}
                </div>
              </section>

              <section className="bwe-soft-tile p-5">
                <div className="bwe-eyebrow">Why this section exists</div>
                <p className="mt-3 text-sm leading-6 text-white/64">
                  The resources section should help people learn and act faster,
                  with clearer article discovery and next-step choices.
                </p>
              </section>
            </aside>
          </section>
        </div>
      </main>
    </>
  );
}

function SignalTile({
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
