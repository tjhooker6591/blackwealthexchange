"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

type AnyResult = Record<string, any>;

function formatLocation(item: AnyResult) {
  const city = item.city || item.address?.city || "";
  const state = item.state || item.address?.state || "";
  const parts = [city, state].filter(Boolean);
  return parts.length ? parts.join(", ") : item.location || "";
}

export default function SearchAI() {
  const router = useRouter();

  const q = useMemo(
    () => (typeof router.query.q === "string" ? router.query.q : ""),
    [router.query.q]
  );
  const type = useMemo(
    () => (typeof router.query.type === "string" ? router.query.type : "businesses"),
    [router.query.type]
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState<AnyResult[]>([]);

  useEffect(() => {
    const run = async () => {
      if (!q) {
        setItems([]);
        return;
      }
      setLoading(true);
      setError("");
      try {
        // Prefer your existing endpoint; keep it flexible.
        // Common patterns:
        //  - /api/search/businesses?search=...&type=...
        //  - /api/search/businesses?q=...&type=...
        const url =
          `/api/search/businesses?` +
          new URLSearchParams({
            search: q,
            q,
            type,
            page: "1",
            limit: "10",
          }).toString();

        const res = await fetch(url);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Search failed");

        const found =
          data?.items ||
          data?.results ||
          data?.data?.items ||
          data?.data?.results ||
          [];

        setItems(Array.isArray(found) ? found : []);
      } catch (e: any) {
        setError(e?.message || "Could not load AI results.");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [q, type]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-3xl font-extrabold tracking-tight">
            AI Mode <span className="text-[#D4AF37]">Search</span>
          </h1>

          <Link
            href="/"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold hover:bg-white/10 transition"
          >
            Back Home
          </Link>
        </div>

        <p className="mt-2 text-white/70">
          Query: <span className="text-white font-semibold">{q || "—"}</span>{" "}
          <span className="ml-2 text-white/40">(type: {type})</span>
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
          <h2 className="text-lg font-extrabold tracking-tight text-white">
            AI Summary (Trusted Flow)
          </h2>
          <p className="mt-2 text-sm text-white/65">
            Next step: this section will generate a concise summary + show only trusted,
            verifiable statements, then link each claim to real listings and sources.
          </p>

          <div className="mt-4 flex gap-3 flex-wrap">
            <Link
              href={{
                pathname: "/business-directory",
                query: q ? { search: q, type } : {},
              }}
              className="rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-extrabold text-black hover:bg-yellow-500 transition"
            >
              Open results in Directory →
            </Link>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-[#D4AF37]">
              Top Results
            </h3>
            {loading && <span className="text-xs text-white/50">Loading…</span>}
          </div>

          {error && (
            <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {!loading && !error && q && items.length === 0 && (
            <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              No results found for this query. Try a different keyword.
            </div>
          )}

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {items.map((item, i) => {
              const name = item.name || item.title || "Unnamed Listing";
              const desc =
                item.description ||
                item.shortDescription ||
                item.summary ||
                "No description available yet.";
              const loc = formatLocation(item);
              const status = item.status || item.verificationStatus || "";
              const id = item._id || item.id;

              return (
                <div
                  key={id || `${name}-${i}`}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.06] transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-lg font-extrabold tracking-tight text-white">
                      {name}
                    </h4>
                    {status && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/70">
                        {status}
                      </span>
                    )}
                  </div>

                  {loc && (
                    <div className="mt-1 text-xs text-white/55">{loc}</div>
                  )}

                  <p className="mt-3 text-sm text-white/70 line-clamp-4">
                    {desc}
                  </p>

                  <div className="mt-4 flex gap-3 flex-wrap">
                    <Link
                      href={{
                        pathname: "/business-directory",
                        query: { search: name, type },
                      }}
                      className="text-sm font-bold text-[#D4AF37] hover:underline"
                    >
                      View in Directory →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-10 text-xs text-white/45">
          Note: AI Mode is currently a “trusted flow” shell — results are pulled from the BWE directory.
          We’ll add summarization + citations next.
        </div>
      </div>
    </div>
  );
}
