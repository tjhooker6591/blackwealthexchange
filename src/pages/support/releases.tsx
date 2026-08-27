import Link from "next/link";
import Head from "next/head";
import {
  labelStyles,
  releaseMeta,
  releaseSections,
} from "@/lib/support/releases";
import { canonicalUrl, truncateMeta } from "@/lib/seo";

export default function ReleasesPage() {
  return (
    <>
      <Head>
        <title>Release Notes | Black Wealth Exchange</title>
        <meta
          name="description"
          content={truncateMeta(
            "Read current Black Wealth Exchange release notes and platform status updates aligned to verified live functionality.",
          )}
        />
        <link rel="canonical" href={canonicalUrl("/support/releases")} />
      </Head>
      <main className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
        <div className="absolute inset-0 bg-neutral-950" />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[720px] w-[720px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />

        <div className="bwe-section-wrap relative z-10 py-8 sm:py-10">
          <section className="bwe-hero-panel relative overflow-hidden rounded-[30px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.08),transparent_24%)]" />
            <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-end">
              <div className="max-w-3xl">
                <div className="bwe-eyebrow">Release notes</div>
                <h1 className="bwe-display-title mt-3 max-w-[12ch]">
                  What is live and what changed.
                </h1>
                <p className="bwe-lead mt-4 max-w-2xl">
                  Read the current Black Wealth Exchange release notes in the
                  same calmer Experience 2.0 support system.
                </p>
              </div>

              <section className="rounded-2xl border border-[rgba(212,175,55,0.24)] bg-[rgba(212,175,55,0.08)] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                  Current release
                </div>
                <h2 className="mt-2 text-lg font-semibold text-white">
                  {releaseMeta.releaseTitle}
                </h2>
                <dl className="mt-3 grid gap-2 text-sm text-white/72">
                  <div>
                    <dt className="inline text-white/48">Release ID:</dt>{" "}
                    <dd className="inline">{releaseMeta.releaseId}</dd>
                  </div>
                  <div>
                    <dt className="inline text-white/48">Published:</dt>{" "}
                    <dd className="inline">{releaseMeta.publishedDate}</dd>
                  </div>
                  <div>
                    <dt className="inline text-white/48">Last updated:</dt>{" "}
                    <dd className="inline">{releaseMeta.lastUpdated}</dd>
                  </div>
                  <div className="pt-1">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${labelStyles[releaseMeta.status]}`}
                    >
                      {releaseMeta.status}
                    </span>
                  </div>
                </dl>
              </section>
            </div>
          </section>

          <section className="mt-8 grid gap-4">
            {releaseSections.map((section) => (
              <article
                key={section.title}
                className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-white">
                    {section.title}
                  </h2>
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${labelStyles[section.label]}`}
                  >
                    {section.label}
                  </span>
                </div>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-white/72">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-white/48">
                  Part of {releaseMeta.releaseId}
                </p>
              </article>
            ))}
          </section>

          <div className="mt-8">
            <Link
              href="/support"
              className="bwe-cta-secondary bwe-focus-ring px-6"
            >
              Back to support
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
