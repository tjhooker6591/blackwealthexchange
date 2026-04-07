#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-.}"

mkdir -p "$ROOT_DIR/src/types"
mkdir -p "$ROOT_DIR/src/pages/api/travel-map"
mkdir -p "$ROOT_DIR/src/components/travel-map"
mkdir -p "$ROOT_DIR/src/pages/travel-map"

cat > "$ROOT_DIR/src/types/travel-map.ts" <<'EOF'
export type TravelMapAddress = {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  formatted?: string;
};

export type TravelMapLocation = {
  lat?: number | null;
  lng?: number | null;
};

export type TravelMapBusiness = {
  _id: string;
  business_name: string;
  slug?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  website?: string;
  phone?: string;
  image?: string | null;
  verified?: boolean;
  sponsored?: boolean;
  featured?: boolean;
  address?: TravelMapAddress;
  location?: TravelMapLocation;
};

export type TravelMapSearchResponse = {
  ok: boolean;
  total: number;
  page: number;
  pageSize: number;
  results: TravelMapBusiness[];
  filters: {
    q: string;
    city: string;
    state: string;
    category: string;
    verified: boolean;
    sponsored: boolean;
  };
};
EOF

cat > "$ROOT_DIR/src/pages/api/travel-map/search.ts" <<'EOF'
import type { NextApiRequest, NextApiResponse } from "next";
import type { Filter, Document } from "mongodb";
import clientPromise from "@/lib/mongodb";
import type {
  TravelMapBusiness,
  TravelMapSearchResponse,
} from "@/types/travel-map";

function firstString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function firstBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return false;
  return value === "true" || value === "1";
}

function firstPositiveInt(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mapBusiness(doc: any): TravelMapBusiness {
  const lat =
    typeof doc?.latitude === "number"
      ? doc.latitude
      : Array.isArray(doc?.location?.coordinates)
        ? Number(doc.location.coordinates[1])
        : null;

  const lng =
    typeof doc?.longitude === "number"
      ? doc.longitude
      : Array.isArray(doc?.location?.coordinates)
        ? Number(doc.location.coordinates[0])
        : null;

  const addressStreet =
    typeof doc?.address === "string"
      ? doc.address
      : typeof doc?.address?.street === "string"
        ? doc.address.street
        : "";

  const city =
    typeof doc?.city === "string"
      ? doc.city
      : typeof doc?.address?.city === "string"
        ? doc.address.city
        : "";

  const state =
    typeof doc?.state === "string"
      ? doc.state
      : typeof doc?.address?.state === "string"
        ? doc.address.state
        : "";

  const zip =
    typeof doc?.zip === "string"
      ? doc.zip
      : typeof doc?.address?.zip === "string"
        ? doc.address.zip
        : "";

  const formattedAddress = [addressStreet, city, state, zip]
    .filter(Boolean)
    .join(", ");

  let image: string | null = null;

  if (typeof doc?.image === "string" && doc.image.trim()) {
    image = doc.image.trim();
  } else if (Array.isArray(doc?.images) && doc.images.length > 0) {
    const first = doc.images[0];
    if (typeof first === "string") image = first;
    else if (first && typeof first.url === "string") image = first.url;
  }

  return {
    _id: String(doc._id),
    business_name: doc?.business_name || "Untitled Business",
    slug: typeof doc?.slug === "string" ? doc.slug : "",
    description: typeof doc?.description === "string" ? doc.description : "",
    category: typeof doc?.category === "string" ? doc.category : "",
    subcategory: typeof doc?.subcategory === "string" ? doc.subcategory : "",
    website: typeof doc?.website === "string" ? doc.website : "",
    phone: typeof doc?.phone === "string" ? doc.phone : "",
    image,
    verified: doc?.verified === true,
    sponsored: doc?.sponsored === true,
    featured: doc?.featured === true,
    address: {
      street: addressStreet,
      city,
      state,
      zip,
      formatted: formattedAddress,
    },
    location: {
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
    },
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TravelMapSearchResponse | { ok: false; error: string }>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const q = firstString(req.query.q);
    const city = firstString(req.query.city);
    const state = firstString(req.query.state);
    const category = firstString(req.query.category);
    const verified = firstBoolean(req.query.verified);
    const sponsored = firstBoolean(req.query.sponsored);
    const page = firstPositiveInt(req.query.page, 1);
    const pageSize = Math.min(firstPositiveInt(req.query.pageSize, 12), 48);

    const filter: Filter<Document> = {
      status: { $nin: ["rejected", "archived"] },
    };

    const andClauses: Document[] = [];

    if (q) {
      const safe = escapeRegex(q);
      andClauses.push({
        $or: [
          { business_name: { $regex: safe, $options: "i" } },
          { description: { $regex: safe, $options: "i" } },
          { category: { $regex: safe, $options: "i" } },
          { subcategory: { $regex: safe, $options: "i" } },
          { city: { $regex: safe, $options: "i" } },
          { state: { $regex: safe, $options: "i" } },
          { "address.city": { $regex: safe, $options: "i" } },
          { "address.state": { $regex: safe, $options: "i" } },
        ],
      });
    }

    if (city) {
      const safeCity = escapeRegex(city);
      andClauses.push({
        $or: [
          { city: { $regex: `^${safeCity}$`, $options: "i" } },
          { "address.city": { $regex: `^${safeCity}$`, $options: "i" } },
        ],
      });
    }

    if (state) {
      const safeState = escapeRegex(state);
      andClauses.push({
        $or: [
          { state: { $regex: `^${safeState}$`, $options: "i" } },
          { "address.state": { $regex: `^${safeState}$`, $options: "i" } },
        ],
      });
    }

    if (category) {
      const safeCategory = escapeRegex(category);
      andClauses.push({
        $or: [
          { category: { $regex: safeCategory, $options: "i" } },
          { subcategory: { $regex: safeCategory, $options: "i" } },
        ],
      });
    }

    if (verified) {
      andClauses.push({ verified: true });
    }

    if (sponsored) {
      andClauses.push({ sponsored: true });
    }

    if (andClauses.length > 0) {
      filter.$and = andClauses;
    }

    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB?.trim();
    const db = dbName ? client.db(dbName) : client.db();
    const businesses = db.collection("businesses");

    const total = await businesses.countDocuments(filter);

    const docs = await businesses
      .find(filter, {
        projection: {
          business_name: 1,
          slug: 1,
          description: 1,
          category: 1,
          subcategory: 1,
          website: 1,
          phone: 1,
          image: 1,
          images: 1,
          verified: 1,
          sponsored: 1,
          featured: 1,
          address: 1,
          city: 1,
          state: 1,
          zip: 1,
          latitude: 1,
          longitude: 1,
          location: 1,
          updatedAt: 1,
        },
      })
      .sort({
        sponsored: -1,
        verified: -1,
        featured: -1,
        updatedAt: -1,
        business_name: 1,
      })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    const results = docs.map(mapBusiness);

    return res.status(200).json({
      ok: true,
      total,
      page,
      pageSize,
      results,
      filters: {
        q,
        city,
        state,
        category,
        verified,
        sponsored,
      },
    });
  } catch (error) {
    console.error("travel-map/search error", error);
    return res.status(500).json({ ok: false, error: "Internal Server Error" });
  }
}
EOF

cat > "$ROOT_DIR/src/components/travel-map/TravelMapCard.tsx" <<'EOF'
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
            {[business.category, business.subcategory].filter(Boolean).join(" • ") ||
              "Black-owned business"}
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
EOF

cat > "$ROOT_DIR/src/components/travel-map/TravelMapFilters.tsx" <<'EOF'
import { useState } from "react";

export type TravelMapFilterValues = {
  q: string;
  city: string;
  state: string;
  category: string;
  verified: boolean;
  sponsored: boolean;
};

export default function TravelMapFilters({
  initialValues,
  onApply,
}: {
  initialValues: TravelMapFilterValues;
  onApply: (values: TravelMapFilterValues) => void;
}) {
  const [values, setValues] = useState<TravelMapFilterValues>(initialValues);

  return (
    <div className="rounded-2xl border border-yellow-500/20 bg-white/5 p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <input
          value={values.q}
          onChange={(e) => setValues((v) => ({ ...v, q: e.target.value }))}
          placeholder="Search businesses, food, beauty, coffee..."
          className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-yellow-400/50"
        />

        <input
          value={values.city}
          onChange={(e) => setValues((v) => ({ ...v, city: e.target.value }))}
          placeholder="City"
          className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-yellow-400/50"
        />

        <input
          value={values.state}
          onChange={(e) => setValues((v) => ({ ...v, state: e.target.value }))}
          placeholder="State"
          className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-yellow-400/50"
        />

        <input
          value={values.category}
          onChange={(e) =>
            setValues((v) => ({ ...v, category: e.target.value }))
          }
          placeholder="Category"
          className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-yellow-400/50"
        />

        <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-gray-200">
          <input
            type="checkbox"
            checked={values.verified}
            onChange={(e) =>
              setValues((v) => ({ ...v, verified: e.target.checked }))
            }
          />
          Verified only
        </label>

        <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-gray-200">
          <input
            type="checkbox"
            checked={values.sponsored}
            onChange={(e) =>
              setValues((v) => ({ ...v, sponsored: e.target.checked }))
            }
          />
          Sponsored only
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={() => onApply(values)}
          className="rounded-xl bg-yellow-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-yellow-400"
        >
          Apply Filters
        </button>

        <button
          onClick={() => {
            const reset = {
              q: "",
              city: "",
              state: "",
              category: "",
              verified: false,
              sponsored: false,
            };
            setValues(reset);
            onApply(reset);
          }}
          className="rounded-xl border border-yellow-500/25 bg-transparent px-5 py-3 text-sm font-semibold text-yellow-200 transition hover:bg-yellow-500/10"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
EOF

cat > "$ROOT_DIR/src/components/travel-map/TravelMapCanvas.tsx" <<'EOF'
import type { TravelMapBusiness } from "@/types/travel-map";

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

  return (
    <div className="h-[420px] rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-neutral-950 via-black to-neutral-900 p-5">
      <div className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div>
          <div className="text-lg font-semibold text-yellow-200">Map View</div>
          <p className="mt-2 max-w-2xl text-sm text-gray-400">
            MVP panel is live and ready for the next step. Black can replace
            this panel with Leaflet or Mapbox next week without changing the
            search API or card layout.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
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
            <div className="mt-2 text-2xl font-bold text-white">
              {mapped.length}
            </div>
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
EOF

cat > "$ROOT_DIR/src/pages/travel-map/index.tsx" <<'EOF'
import Head from "next/head";
import Link from "next/link";

export default function TravelMapLandingPage() {
  return (
    <>
      <Head>
        <title>Travel Map | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Discover Black-owned businesses while traveling with the Black Wealth Exchange Travel Map."
        />
      </Head>

      <div className="min-h-screen bg-black text-white">
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 via-black to-black p-8 shadow-2xl shadow-black/30 sm:p-12">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-yellow-300">
                BWE Travel Map
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Find Black-owned businesses wherever you go.
              </h1>
              <p className="mt-5 text-lg leading-8 text-gray-300">
                Search by city, state, category, and keywords to discover
                Black-owned restaurants, shops, services, and brands while
                traveling.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/travel-map/explore"
                  className="rounded-2xl bg-yellow-500 px-6 py-4 font-semibold text-black transition hover:bg-yellow-400"
                >
                  Explore the Map
                </Link>

                <Link
                  href="/business-directory"
                  className="rounded-2xl border border-yellow-500/30 bg-transparent px-6 py-4 font-semibold text-yellow-200 transition hover:bg-yellow-500/10"
                >
                  Open Directory
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              [
                "Search by city",
                "Look up Atlanta, Houston, Chicago, Detroit, Los Angeles, and more.",
              ],
              [
                "Filter by category",
                "Food, beauty, retail, professional services, culture, and community.",
              ],
              [
                "Get directions only when needed",
                "BWE handles discovery first. Native maps are only for turn-by-turn travel.",
              ],
            ].map(([title, text]) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <h2 className="text-lg font-semibold text-yellow-200">
                  {title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-300">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
EOF

cat > "$ROOT_DIR/src/pages/travel-map/explore.tsx" <<'EOF'
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import TravelMapCard from "@/components/travel-map/TravelMapCard";
import TravelMapCanvas from "@/components/travel-map/TravelMapCanvas";
import TravelMapFilters, {
  type TravelMapFilterValues,
} from "@/components/travel-map/TravelMapFilters";
import type {
  TravelMapBusiness,
  TravelMapSearchResponse,
} from "@/types/travel-map";

const initialFilters: TravelMapFilterValues = {
  q: "",
  city: "",
  state: "",
  category: "",
  verified: false,
  sponsored: false,
};

function buildQuery(filters: TravelMapFilterValues) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.city) params.set("city", filters.city);
  if (filters.state) params.set("state", filters.state);
  if (filters.category) params.set("category", filters.category);
  if (filters.verified) params.set("verified", "true");
  if (filters.sponsored) params.set("sponsored", "true");
  params.set("page", "1");
  params.set("pageSize", "12");
  return params.toString();
}

export default function TravelMapExplorePage() {
  const [filters, setFilters] =
    useState<TravelMapFilterValues>(initialFilters);
  const [results, setResults] = useState<TravelMapBusiness[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<"split" | "list">("split");

  const queryString = useMemo(() => buildQuery(filters), [filters]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`/api/travel-map/search?${queryString}`);
        const data =
          (await res.json()) as
            | TravelMapSearchResponse
            | { ok: false; error: string };

        if (!res.ok || !data.ok) {
          throw new Error("error" in data ? data.error : "Failed to load map results");
        }

        if (!cancelled) {
          setResults(data.results);
          setTotal(data.total);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load results");
          setResults([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [queryString]);

  return (
    <>
      <Head>
        <title>Explore Travel Map | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Search and explore Black-owned businesses while traveling with the BWE Travel Map."
        />
      </Head>

      <div className="min-h-screen bg-black text-white">
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-300">
                Travel Map
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Explore Black-owned businesses on the move.
              </h1>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
              <button
                onClick={() => setView("split")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  view === "split"
                    ? "bg-yellow-500 text-black"
                    : "text-gray-300 hover:bg-white/5"
                }`}
              >
                Split View
              </button>
              <button
                onClick={() => setView("list")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  view === "list"
                    ? "bg-yellow-500 text-black"
                    : "text-gray-300 hover:bg-white/5"
                }`}
              >
                List Only
              </button>
            </div>
          </div>

          <TravelMapFilters initialValues={filters} onApply={setFilters} />

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-gray-300">
            {loading ? "Loading results..." : `${total} businesses found`}
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div
            className={`mt-6 grid gap-6 ${
              view === "split"
                ? "xl:grid-cols-[1.05fr_0.95fr]"
                : "grid-cols-1"
            }`}
          >
            <div className="space-y-4">
              {loading ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-gray-400">
                  Loading map results...
                </div>
              ) : results.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-gray-400">
                  No businesses matched your filters yet.
                </div>
              ) : (
                results.map((business) => (
                  <TravelMapCard key={business._id} business={business} />
                ))
              )}
            </div>

            {view === "split" ? <TravelMapCanvas results={results} /> : null}
          </div>
        </section>
      </div>
    </>
  );
}
EOF

echo "Travel Map MVP files updated."