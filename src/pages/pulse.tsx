// src/pages/pulse.tsx
//
// BWE Pulse -- the personalized daily feed. Where /my-bwe is "show me what
// I've built here" (counts and links out), Pulse is "show me what's new" --
// a scrollable stream of real updates from businesses you follow, backed
// by /api/pulse/feed, which itself composes three already-existing, already
// -working building blocks (follows, business_updates, the recommendation
// engine) rather than introducing new data.

import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { canonicalUrl } from "@/lib/seo";

type PulseItem = {
  id: string;
  businessId: string;
  businessName: string;
  businessHref: string | null;
  title: string;
  body: string;
  createdAt: string | null;
};

type DiscoverBusiness = {
  businessId: string;
  name: string;
  category: string | null;
  city: string | null;
  state: string | null;
  url: string;
};

type FeedResponse = {
  ok: boolean;
  followingCount: number;
  items: PulseItem[];
  discover: {
    state: "PERSONALIZED" | "TRENDING_FALLBACK" | "INSUFFICIENT_DATA";
    businesses: DiscoverBusiness[];
  };
};

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function PulsePage() {
  const { user, loading: authLoading } = useAuth({ silentOnPublic: false });
  const [loading, setLoading] = useState(true);
  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [error, setError] = useState("");

  const canonical = canonicalUrl("/pulse");

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch("/api/pulse/feed", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: FeedResponse) => setFeed(data))
      .catch(() => setError("Couldn't load your feed right now."))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <>
      <Head>
        <title>BWE Pulse | Black Wealth Exchange</title>
        <meta name="robots" content="noindex,follow" />
        <link rel="canonical" href={canonical} />
      </Head>
      <div className="min-h-screen bg-black text-white">
        <div className="bwe-section-wrap py-8 sm:py-10">
          <div className="bwe-eyebrow">BWE Pulse</div>
          <h1 className="bwe-display-title mt-2 text-3xl sm:text-4xl">
            What&apos;s happening in your BWE network.
          </h1>
          <p className="bwe-lead mt-3 max-w-xl">
            Real updates from businesses you follow, plus what&apos;s trending
            across BWE.
          </p>

          {authLoading || loading ? (
            <div className="mt-8 text-white/60">Loading…</div>
          ) : !user ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
              <Link
                href="/login?next=/pulse"
                className="text-[var(--accent)] underline"
              >
                Log in
              </Link>{" "}
              to see your Pulse.
            </div>
          ) : error ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
              {error}
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                {feed?.followingCount === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
                    You&apos;re not following any businesses yet.{" "}
                    <Link
                      href="/business-directory"
                      className="text-[var(--accent)] underline"
                    >
                      Find some to follow
                    </Link>{" "}
                    and their updates will show up here.
                  </div>
                ) : !feed?.items?.length ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
                    No updates yet from businesses you follow. Check back soon,
                    or browse what&apos;s trending on the right.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {feed.items.map((item) => (
                      <article
                        key={item.id}
                        className="bwe-grid-card flex flex-col gap-2 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          {item.businessHref ? (
                            <Link
                              href={item.businessHref}
                              className="bwe-card-title hover:text-[var(--accent)]"
                            >
                              {item.businessName}
                            </Link>
                          ) : (
                            <div className="bwe-card-title">
                              {item.businessName}
                            </div>
                          )}
                          <span className="shrink-0 text-xs text-white/45">
                            {timeAgo(item.createdAt)}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-white/90">
                          {item.title}
                        </div>
                        <p className="text-sm leading-5 text-white/70">
                          {item.body}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div className="bwe-eyebrow">
                  {feed?.discover?.state === "PERSONALIZED"
                    ? "Recommended for you"
                    : "Trending on BWE"}
                </div>
                {(feed?.discover?.businesses || []).length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/60">
                    Nothing trending yet.
                  </div>
                ) : (
                  feed?.discover?.businesses.map((biz) => (
                    <Link
                      key={biz.businessId}
                      href={biz.url}
                      className="bwe-grid-card bwe-focus-ring flex flex-col gap-1 p-4"
                    >
                      <div className="bwe-card-title">{biz.name}</div>
                      <p className="text-xs text-white/55">
                        {[
                          biz.category,
                          [biz.city, biz.state].filter(Boolean).join(", "),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
