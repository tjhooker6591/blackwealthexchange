// src/pages/collections/index.tsx
//
// Phase 5 -- Collections. List the caller's own collections and create new
// ones. Real data only, backed by /api/user/collections.ts.

import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { canonicalUrl } from "@/lib/seo";

type Collection = {
  id: string;
  name: string;
  description: string | null;
  itemCount: number;
};

export default function CollectionsPage() {
  const { user, loading: authLoading } = useAuth({ silentOnPublic: false });
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const res = await fetch("/api/user/collections", {
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      setCollections(data?.collections || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    load();
  }, [user]);

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/user/collections", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        setName("");
        await load();
      }
    } finally {
      setCreating(false);
    }
  }

  const canonical = canonicalUrl("/collections");

  return (
    <>
      <Head>
        <title>Collections | Black Wealth Exchange</title>
        <meta name="robots" content="noindex,follow" />
        <link rel="canonical" href={canonical} />
      </Head>
      <div className="min-h-screen bg-black text-white">
        <div className="bwe-section-wrap py-8 sm:py-10">
          <div className="bwe-eyebrow">My BWE</div>
          <h1 className="bwe-display-title mt-2 text-3xl sm:text-4xl">
            Collections
          </h1>
          <p className="bwe-lead mt-3 max-w-xl">
            Organize businesses and products you&apos;ve saved into your own
            named lists.
          </p>

          {authLoading || loading ? (
            <div className="mt-8 text-white/60">Loading…</div>
          ) : !user ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
              <Link
                href="/login?next=/collections"
                className="text-[var(--accent)] underline"
              >
                Log in
              </Link>{" "}
              to create collections.
            </div>
          ) : (
            <>
              <div className="mt-8 flex flex-wrap items-center gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="New collection name…"
                  maxLength={80}
                  className="bwe-input max-w-xs"
                />
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating || !name.trim()}
                  className="rounded-lg bg-yellow-500 px-4 py-2 text-xs font-extrabold text-black disabled:opacity-50"
                >
                  {creating ? "Creating…" : "Create collection"}
                </button>
              </div>

              {collections.length === 0 ? (
                <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
                  No collections yet. Create one above, then add saved
                  businesses or products to it.
                </div>
              ) : (
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {collections.map((c) => (
                    <Link
                      key={c.id}
                      href={`/collections/${c.id}`}
                      className="bwe-grid-card bwe-focus-ring block p-4"
                    >
                      <div className="bwe-card-title">{c.name}</div>
                      <div className="mt-2 text-sm text-white/60">
                        {c.itemCount} item{c.itemCount === 1 ? "" : "s"}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
