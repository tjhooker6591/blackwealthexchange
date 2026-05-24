import Link from "next/link";

type ReleaseSection = {
  title: string;
  label: "Available now" | "Improved" | "Foundation update";
  bullets: string[];
};

const releaseMeta = {
  releaseTitle: "BWE May 2026 Platform Update",
  releaseId: "BWE-2026.05",
  publishedDate: "May 12, 2026",
  lastUpdated: "May 12, 2026, 11:30 AM PT",
  status: "Available now" as const,
};

const sections: ReleaseSection[] = [
  {
    title: "Search & Directory improvements",
    label: "Improved",
    bullets: [
      "Better search quality and consistency across business directory views.",
      "Directory browsing now has more reliable result rendering.",
    ],
  },
  {
    title: "Marketplace stability improvements",
    label: "Improved",
    bullets: [
      "Order and product flows are now more stable across common user paths.",
      "Checkout and seller workflows received reliability-focused updates.",
    ],
  },
  {
    title: "Support experience improvements",
    label: "Available now",
    bullets: [
      "Support routes and ticket surfaces were tightened for better consistency.",
      "Release notes now have a dedicated user-facing page in Support.",
    ],
  },
  {
    title: "Wealth Builder foundation updates",
    label: "Foundation update",
    bullets: [
      "Core Wealth Builder APIs and auth/entitlement plumbing were expanded.",
      "Budget, debt, goals, insights, and transaction foundations are in place.",
    ],
  },
  {
    title: "Travel Map foundation updates",
    label: "Foundation update",
    bullets: [
      "Travel Map API and page scaffolding expanded for upcoming user features.",
      "Saved and nearby experience foundations were added for future releases.",
    ],
  },
  {
    title: "Sponsor & Business Image reliability improvements",
    label: "Improved",
    bullets: [
      "Fallback image handling was improved for business and sponsor content.",
      "Image loading reliability was strengthened across key pages.",
    ],
  },
  {
    title: "Security/session/runtime stability improvements",
    label: "Improved",
    bullets: [
      "Session and runtime guardrails were hardened in core app paths.",
      "Security-related route protections were reinforced for stability.",
    ],
  },
];

const labelStyles: Record<ReleaseSection["label"], string> = {
  "Available now": "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  Improved: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  "Foundation update": "bg-sky-500/20 text-sky-300 border-sky-500/40",
};

export default function ReleasesPage() {
  return (
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
              <dt className="inline font-medium text-zinc-400">Release ID:</dt>{" "}
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
            {sections.map((section) => (
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
  );
}
