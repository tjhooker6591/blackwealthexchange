// Badge shown on a listing page once that business has been featured as
// Business of the Day. Renders nothing otherwise.

import { useEffect, useState } from "react";

export default function BusinessOfTheDayBadge({
  businessId,
  slug,
}: {
  businessId?: string | null;
  slug?: string | null;
}) {
  const [featuredAt, setFeaturedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId && !slug) return;
    const params = new URLSearchParams();
    if (businessId) params.set("businessId", businessId);
    if (slug) params.set("slug", slug);
    if (
      new URLSearchParams(window.location.search).get("botdPreview") === "1"
    ) {
      params.set("preview", "1");
    }
    fetch(`/api/business-of-the-day?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setFeaturedAt(data?.featuredAt || null))
      .catch(() => setFeaturedAt(null));
  }, [businessId, slug]);

  if (!featuredAt) return null;

  return (
    <span className="text-[11px] sm:text-xs rounded-full border border-yellow-400/60 bg-yellow-500/20 px-2.5 py-0.5 sm:px-3 sm:py-1 font-semibold text-yellow-200">
      BWE Business of the Day ·{" "}
      {new Date(featuredAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}
    </span>
  );
}
