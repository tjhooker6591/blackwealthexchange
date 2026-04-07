import Link from "next/link";
import type { TravelMapBusiness } from "@/types/travel-map";

function buildDirectionsUrl(business: TravelMapBusiness) {
  const lat = business.location?.lat;
  const lng = business.location?.lng;

  if (typeof lat === "number" && typeof lng === "number") {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  const fallback = encodeURIComponent(
    business.address?.formatted ||
      `${business.business_name} ${business.address?.city || ""} ${business.address?.state || ""}`.trim(),
  );

  return `https://www.google.com/maps/search/?api=1&query=${fallback}`;
}

export default function TravelMapCard({
  business,
}: {
  business: TravelMapBusiness;
}) {
  return (
    <article className="rounded-2xl border border-yellow-500/20 bg-white/5 p-4 shadow-lg shadow-black/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {business.business_name}
          </h3>
          <p className="mt-1 text-sm text-yellow-200/90">
            {[business.category, business.subcategory]
              .filter(Boolean)
              .join(" • ") || "Black-owned business"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {business.sponsored ? (
            <span className="rounded-full border border-yellow-400/40 bg-yellow-500/10 px-2 py-1 text-yellow-200">
              Sponsored
            </span>
          ) : null}
          {business.verified ? (
            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-emerald-200">
              Verified
            </span>
          ) : null}
        </div>
      </div>

      {business.description ? (
        <p className="mt-3 line-clamp-3 text-sm text-gray-300">
          {business.description}
        </p>
      ) : null}

      {business.address?.formatted ? (
        <p className="mt-3 text-sm text-gray-400">
          {business.address.formatted}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        {business.slug ? (
          <Link
            href={`/business/${business.slug}`}
            className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-yellow-400"
          >
            View Business
          </Link>
        ) : null}

        <a
          href={buildDirectionsUrl(business)}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-yellow-500/30 bg-transparent px-4 py-2 text-sm font-semibold text-yellow-200 transition hover:bg-yellow-500/10"
        >
          Directions
        </a>

        {business.website ? (
          <a
            href={business.website}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Website
          </a>
        ) : null}
      </div>
    </article>
  );
}
