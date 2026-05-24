import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import TravelMapNav from "@/components/travel-map/TravelMapNav";
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

export default function TravelMapBusinessDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [business, setBusiness] = useState<TravelMapBusiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (typeof id !== "string" || !id) return;
    const businessId = id;

    let cancelled = false;

    async function loadSavedState() {
      try {
        const res = await fetch(
          `/api/travel-map/saved?businessId=${encodeURIComponent(businessId)}`,
        );

        if (!res.ok) return;

        const data = await res.json();
        if (!cancelled) {
          setSaved(Boolean(data?.saved));
        }
      } catch {
        if (!cancelled) {
          setSaved(false);
        }
      }
    }

    async function load() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`/api/travel-map/business/${businessId}`);
        const data = await res.json();

        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || "Failed to load business detail.");
        }

        if (!cancelled) {
          setBusiness(data.business || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load business detail.",
          );
          setBusiness(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    void loadSavedState();

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function toggleSaved() {
    if (!business || saving) return;

    setSaving(true);
    setError("");

    try {
      const method = saved ? "DELETE" : "POST";
      const res = await fetch("/api/travel-map/saved", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business._id }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(
          data?.message ||
            (saved ? "Failed to remove saved place." : "Failed to save place."),
        );
      }

      setSaved(!saved);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : saved
            ? "Failed to remove saved place."
            : "Failed to save place.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Head>
        <title>Travel Map Business Detail | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Discover detailed business information inside BWE Travel Map before optional directions handoff."
        />
      </Head>
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <TravelMapNav />
          <section className="rounded-3xl border border-yellow-700/30 bg-zinc-950/90 p-8">
            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-gray-400">
                Loading business detail...
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
                {error}
              </div>
            ) : !business ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-gray-400">
                Business not found.
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">
                  Business Detail
                </p>
                <h1 className="mt-3 text-4xl font-bold">
                  {business.business_name}
                </h1>

                <p className="mt-3 text-zinc-300">
                  {[business.category, business.subcategory]
                    .filter(Boolean)
                    .join(" • ") || "Black-owned business"}
                </p>

                {business.description ? (
                  <p className="mt-5 max-w-3xl text-zinc-300">
                    {business.description}
                  </p>
                ) : null}

                {business.address?.formatted ? (
                  <p className="mt-5 text-zinc-300">
                    {business.address.formatted}
                  </p>
                ) : null}

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/travel-map/explore"
                    className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-yellow-400"
                  >
                    Back to Explore
                  </Link>

                  <a
                    href={buildDirectionsUrl(business)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-yellow-500/25 bg-transparent px-4 py-2 text-sm font-semibold text-yellow-200 transition hover:bg-yellow-500/10"
                  >
                    Open in Maps
                  </a>

                  <button
                    type="button"
                    onClick={() => void toggleSaved()}
                    disabled={saving}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      saved
                        ? "border border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                        : "border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                    }`}
                  >
                    {saving
                      ? saved
                        ? "Removing..."
                        : "Saving..."
                      : saved
                        ? "Remove saved"
                        : "Save"}
                  </button>

                  {business.website ? (
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Website
                    </a>
                  ) : null}

                  {business.slug ? (
                    <Link
                      href={`/business/${business.slug}`}
                      className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Directory Profile
                    </Link>
                  ) : null}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
