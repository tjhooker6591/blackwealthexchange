import dynamic from "next/dynamic";
import type { TravelMapBusiness } from "@/types/travel-map";

const TravelMapLeaflet = dynamic(
  () => import("@/components/travel-map/TravelMapLeaflet"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] items-center justify-center rounded-2xl border border-yellow-500/20 bg-black/50 text-sm text-gray-300">
        Loading map…
      </div>
    ),
  },
);

export default function TravelMapCanvas({
  results,
}: {
  results: TravelMapBusiness[];
}) {
  const mapped = results.filter(
    (item) =>
      typeof item.location?.lat === "number" &&
      typeof item.location?.lng === "number",
  );

  if (mapped.length === 0) {
    return (
      <div className="h-[420px] rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-neutral-950 via-black to-neutral-900 p-5">
        <div className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div>
            <div className="text-lg font-semibold text-yellow-200">
              Map View
            </div>
            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              No mapped coordinates found for the current filter set yet.
              Listings remain visible in list view and can still open directions
              via address fallback.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                Results
              </div>
              <div className="mt-2 text-2xl font-bold text-white">
                {results.length}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                Mapped
              </div>
              <div className="mt-2 text-2xl font-bold text-white">0</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                Verified
              </div>
              <div className="mt-2 text-2xl font-bold text-white">
                {results.filter((r) => r.verified).length}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                Sponsored
              </div>
              <div className="mt-2 text-2xl font-bold text-white">
                {results.filter((r) => r.sponsored).length}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <TravelMapLeaflet results={results} />;
}
