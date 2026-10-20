// Homepage spot for the current Business of the Day. Renders nothing until
// an admin has approved a feature in /admin/business-of-the-day, and nothing
// once the latest feature is more than a week old.

import Link from "next/link";
import { useEffect, useState } from "react";

type Feature = {
  name: string;
  slug: string;
  location: string;
  category: string;
  line: string;
  featuredAt: string;
};

export default function BusinessOfTheDaySpot() {
  const [feature, setFeature] = useState<Feature | null>(null);

  useEffect(() => {
    // Opening the page with ?botdPreview=1 (optionally &botdCity=Atlanta)
    // previews the spot on localhost; the deployed API ignores it.
    const query = new URLSearchParams(window.location.search);
    const params = new URLSearchParams();
    if (query.get("botdPreview") === "1") {
      params.set("preview", "1");
      if (query.get("botdCity")) params.set("city", query.get("botdCity")!);
    }
    const qs = params.toString();
    fetch(`/api/business-of-the-day${qs ? `?${qs}` : ""}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setFeature(data?.feature || null))
      .catch(() => setFeature(null));
  }, []);

  if (!feature) return null;

  const meta = [feature.location, feature.category].filter(Boolean).join(" · ");

  return (
    <section className="mb-8 border-t border-white/8 pt-6">
      <Link
        href={`/business/${feature.slug}`}
        className="block rounded-2xl border border-yellow-400/40 bg-gradient-to-br from-yellow-500/10 to-black p-5 transition hover:border-yellow-400/70"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold tracking-[0.14em] text-[var(--accent)]">
            BWE BUSINESS OF THE DAY
          </span>
          <span className="text-[11px] text-white/45">
            {new Date(feature.featuredAt).toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
        <h3 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
          {feature.name}
        </h3>
        {meta ? <p className="mt-1 text-sm text-yellow-300">{meta}</p> : null}
        <p className="mt-3 text-sm text-white/70">{feature.line}</p>
        <span className="mt-4 inline-flex rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black">
          View this business
        </span>
      </Link>
    </section>
  );
}
