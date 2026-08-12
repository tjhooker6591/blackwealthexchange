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
      <main className="min-h-screen bg-black text-white p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-yellow-400">
            What’s New at Black Wealth Exchange
          </h1>
          <p className="text-zinc-300 max-w-3xl">
            This page summarizes recent platform improvements so you can quickly
            see what is available now, what has improved, and which foundation
            updates are setting up future features.
          </p>

          <section className="rounded-xl border border-yellow-500/20 bg-zinc-950/70 p-5">
            <h2 className="text-xl font-semibold text-yellow-300">
              Release: {releaseMeta.releaseTitle}
            </h2>
            <dl className="mt-3 grid gap-2 text-sm text-zinc-200">
              <div>
                <dt className="inline font-medium text-zinc-400">
                  Release ID:
                </dt>{" "}
                <dd className="inline">{releaseMeta.releaseId}</dd>
              </div>
              <div>
                <dt className="inline font-medium text-zinc-400">Published:</dt>{" "}
                <dd className="inline">{releaseMeta.publishedDate}</dd>
              </div>
              <div>
                <dt className="inline font-medium text-zinc-400">
                  Last updated:
                </dt>{" "}
                <dd className="inline">{releaseMeta.lastUpdated}</dd>
              </div>
              <div className="flex items-center gap-2">
                <dt className="font-medium text-zinc-400">Status:</dt>
                <dd>
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${labelStyles[releaseMeta.status]}`}
                  >
                    {releaseMeta.status}
                  </span>
                </dd>
              </div>
            </dl>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-yellow-300">
              Included in this release
            </h2>
            <div className="grid gap-4">
              {releaseSections.map((section) => (
                <article
                  key={section.title}
                  className="rounded-xl border border-yellow-500/20 bg-zinc-950/70 p-5"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h2 className="text-xl font-semibold text-yellow-300">
                      {section.title}
                    </h2>
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${labelStyles[section.label]}`}
                    >
                      {section.label}
                    </span>
                  </div>
                  <ul className="mt-3 list-disc pl-6 text-zinc-200 space-y-1">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-zinc-400">
                    Part of {releaseMeta.releaseId}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <div>
            <Link
              href="/support"
              className="inline-flex items-center rounded border border-zinc-700 px-4 py-2 text-zinc-200 hover:border-yellow-500/60 hover:text-yellow-300"
            >
              Back to Support
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
