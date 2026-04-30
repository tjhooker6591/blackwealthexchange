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
  enableSave = true,
  isSaved,
  onToggleSave,
  saveBusy = false,
  saveHydrating = false,
}: {
  business: TravelMapBusiness;
  enableSave?: boolean;
  isSaved?: boolean;
  onToggleSave?: (
    business: TravelMapBusiness,
    nextSaved: boolean,
  ) => Promise<void> | void;
  saveBusy?: boolean;
  saveHydrating?: boolean;
}) {
  async function savePlace() {
    if (onToggleSave) {
      try {
        await onToggleSave(business, !Boolean(isSaved));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update saved place.";
        window.alert(message);
      }
      return;
    }

    try {
      const method = isSaved ? "DELETE" : "POST";
      const res = await fetch("/api/travel-map/saved", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business._id }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(
          data?.message ||
            (isSaved
              ? "Failed to remove saved place."
              : "Failed to save place."),
        );
      }

      window.alert(
        isSaved ? "Removed from Travel Map." : "Saved to Travel Map.",
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : isSaved
            ? "Failed to remove saved place."
            : "Failed to save place.";
      window.alert(message);
    }
  }

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
          {isSaved && !saveBusy ? (
            <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-cyan-200">
              Saved
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

      {typeof business.distanceKm === "number" ? (
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-emerald-300">
          {business.distanceKm.toFixed(1)} km away
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={`/travel-map/business/${business._id}`}
          className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-yellow-400"
        >
          Travel Map Detail
        </Link>

        {business.slug ? (
          <Link
            href={`/business/${business.slug}`}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Directory Profile
          </Link>
        ) : null}

        <a
          href={buildDirectionsUrl(business)}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-yellow-500/30 bg-transparent px-4 py-2 text-sm font-semibold text-yellow-200 transition hover:bg-yellow-500/10"
        >
          Open in Maps
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

        {enableSave ? (
          <button
            type="button"
            onClick={() => void savePlace()}
            disabled={saveBusy || saveHydrating}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isSaved
                ? "border border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                : "border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
            }`}
          >
            {saveHydrating
              ? "Syncing..."
              : saveBusy
                ? isSaved
                  ? "Removing..."
                  : "Saving..."
                : isSaved
                  ? "Remove saved"
                  : "Save"}
          </button>
        ) : null}
      </div>
    </article>
  );
}
