// src/pages/pulse.tsx
//
// BWE Pulse -- the personalized daily feed. Where /my-bwe is "show me what
// I've built here" (counts and links out), Pulse is "show me what's new" --
// a scrollable stream of real updates from businesses AND people you
// follow, backed by /api/pulse/feed, which composes several already-
// existing building blocks (follows, user_follows, business_updates,
// member_posts, the recommendation engine) rather than introducing new
// data of its own.

import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { canonicalUrl } from "@/lib/seo";
import {
  buildPulseMoments,
  ENTERTAINMENT_KEYWORDS,
  type FeedItem,
  type PulseMoment,
} from "@/lib/pulse";
import { Avatar } from "@/components/pulse/Avatar";
import { timeAgo } from "@/components/pulse/timeAgo";
import CommentThread from "@/components/pulse/CommentThread";
import HomepagePulseJoinTeaser from "@/components/pulse/HomepagePulseJoinTeaser";

type PulseItem = {
  type: "business" | "person";
  id: string;
  authorId: string;
  authorName: string;
  authorHref: string;
  authorAvatarUrl: string | null;
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
  publicItems: PulseItem[];
  discover: {
    state: "PERSONALIZED" | "TRENDING_FALLBACK" | "INSUFFICIENT_DATA";
    businesses: DiscoverBusiness[];
  };
};

function MomentCard({ moment }: { moment: PulseMoment }) {
  return (
    <Link
      href="/black-entertainment-news"
      className="bwe-grid-card bwe-focus-ring flex flex-col gap-2 p-4"
    >
      {moment.heroImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={moment.heroImage}
          alt={moment.title}
          className="h-24 w-full rounded-xl object-cover"
        />
      ) : null}
      <div className="bwe-card-title line-clamp-2">{moment.title}</div>
      <p className="line-clamp-2 text-xs text-white/55">{moment.takeaway}</p>
    </Link>
  );
}

export default function PulsePage() {
  const { user, loading: authLoading } = useAuth({ silentOnPublic: false });
  const [loading, setLoading] = useState(true);
  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [error, setError] = useState("");

  const [composeBody, setComposeBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [composeState, setComposeState] = useState<string | null>(null);

  const [cultureMoments, setCultureMoments] = useState<PulseMoment[]>([]);

  // "Following" vs "Everyone" (2026-09-11) -- addresses a real gap: there
  // was no way to see posts from businesses/members you don't follow, only
  // trending business cards in the sidebar. Defaults to "Everyone" the
  // first time the feed loads if you follow nothing yet, since a
  // following-only feed would just be empty.
  const [tab, setTab] = useState<"following" | "everyone">("following");
  const [tabDefaulted, setTabDefaulted] = useState(false);

  const canonical = canonicalUrl("/pulse");

  useEffect(() => {
    fetch("/api/news/black?limit=150")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data) => {
        const items: FeedItem[] = (data?.items || []).filter((it: FeedItem) =>
          ENTERTAINMENT_KEYWORDS.test(`${it.title} ${it.snippet || ""}`),
        );
        setCultureMoments(buildPulseMoments(items));
      })
      .catch(() => setCultureMoments([]));
  }, []);

  // Trending Top (2026-09-11): two real lenses on the same clustered
  // culture/entertainment moments, ranked by the existing heat score --
  // not a fabricated age-demographic split (no source data ties a story
  // to an age group), but a real distinction that's already in the data:
  // "Hype" = fast-moving/viral, "Iconic"/"DeepDive" = reflective/legacy.
  const trendingNow = [...cultureMoments]
    .filter((m) => m.vibe.includes("Hype"))
    .sort((a, b) => b.heat - a.heat)
    .slice(0, 4);
  const iconicTimeless = [...cultureMoments]
    .filter((m) => m.vibe.includes("Iconic") || m.vibe.includes("DeepDive"))
    .sort((a, b) => b.heat - a.heat)
    .slice(0, 4);

  const loadFeed = () => {
    if (!user) return;
    setLoading(true);
    fetch("/api/pulse/feed", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: FeedResponse) => {
        setFeed(data);
        if (!tabDefaulted) {
          setTab(data.followingCount === 0 ? "everyone" : "following");
          setTabDefaulted(true);
        }
      })
      .catch(() => setError("Couldn't load your feed right now."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    loadFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  async function handlePost() {
    setPosting(true);
    setComposeState(null);
    try {
      const res = await fetch("/api/user/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ body: composeBody }),
      });
      const data = await res.json();
      if (!res.ok) {
        setComposeState(data?.error || "Couldn't post. Please try again.");
        return;
      }
      setComposeBody("");
      setComposeState("Posted.");
      loadFeed();
    } catch {
      setComposeState("Couldn't post. Please try again.");
    } finally {
      setPosting(false);
    }
  }

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
            Real updates from businesses and people you follow, plus what&apos;s
            trending across BWE.
          </p>

          {authLoading || loading ? (
            <div className="mt-8 text-white/60">Loading…</div>
          ) : !user ? (
            // Before this (2026-09-12), a visitor with no account saw only
            // a bare "Log in to see your Pulse" line here -- nothing that
            // made them want to join. Real activity + a join CTA now show
            // instead; see HomepagePulseJoinTeaser for the same pattern
            // used on the homepage.
            <div className="mt-8">
              <HomepagePulseJoinTeaser />
              <div className="mt-3 text-center text-sm text-white/50">
                Already have an account?{" "}
                <Link
                  href="/login?next=/pulse"
                  className="text-[var(--accent)] underline"
                >
                  Log in
                </Link>
              </div>

              {/* Tell them it exists, don't hand it over -- the actual
                  Trending Now / Iconic & Timeless content only renders
                  for a logged-in user below; this is a locked announcement,
                  not a preview of the real thing. */}
              <Link
                href="/signup?intent=join-bwe-pulse"
                className="bwe-focus-ring mt-8 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#D4AF37]/30 hover:bg-white/[0.05]"
              >
                <div>
                  <div className="bwe-eyebrow">Culture &amp; Entertainment</div>
                  <p className="mt-1 text-sm text-white/60">
                    Trending Now and Iconic &amp; Timeless -- what&apos;s hot in
                    Black culture and entertainment, curated daily. Join to
                    explore it.
                  </p>
                </div>
                <span className="shrink-0 text-lg">🔒</span>
              </Link>
            </div>
          ) : error ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
              {error}
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="bwe-grid-card mb-4 flex flex-col gap-2 p-4">
                  <textarea
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    placeholder="Share something with people who follow you -- a recommendation, a hire, a question..."
                    maxLength={500}
                    rows={2}
                    className="bwe-textarea w-full"
                  />
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handlePost}
                      disabled={posting || !composeBody.trim()}
                      className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-extrabold text-black disabled:opacity-50"
                    >
                      {posting ? "Posting…" : "Post"}
                    </button>
                    {composeState ? (
                      <span className="text-xs text-white/60">
                        {composeState}{" "}
                        {composeState.startsWith("Make your profile") ? (
                          <Link
                            href="/profile"
                            className="text-[var(--accent)] underline"
                          >
                            Go to Profile settings
                          </Link>
                        ) : null}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mb-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTab("following")}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                      tab === "following"
                        ? "bg-[var(--accent)] text-black"
                        : "bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    Following
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("everyone")}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                      tab === "everyone"
                        ? "bg-[var(--accent)] text-black"
                        : "bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    Everyone
                  </button>
                </div>

                {tab === "following" && feed?.followingCount === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
                    You&apos;re not following any businesses or members yet.{" "}
                    <Link
                      href="/business-directory"
                      className="text-[var(--accent)] underline"
                    >
                      Find some to follow
                    </Link>{" "}
                    and their updates will show up here.
                  </div>
                ) : !(tab === "following" ? feed?.items : feed?.publicItems)
                    ?.length ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
                    {tab === "following"
                      ? "No updates yet from businesses or members you follow. Check back soon, or browse what's trending on the right."
                      : "Nothing posted on BWE yet. Check back soon."}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {(tab === "following"
                      ? feed!.items
                      : feed!.publicItems
                    ).map((item) => (
                      <article
                        key={`${item.type}-${item.id}`}
                        className="bwe-grid-card flex flex-col gap-2 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <Link
                            href={item.authorHref}
                            className="flex min-w-0 items-center gap-2"
                          >
                            <Avatar
                              name={item.authorName}
                              url={item.authorAvatarUrl}
                            />
                            <span className="bwe-card-title truncate hover:text-[var(--accent)]">
                              {item.authorName}
                            </span>
                          </Link>
                          <span className="shrink-0 text-xs text-white/45">
                            {timeAgo(item.createdAt)}
                          </span>
                        </div>
                        {item.title ? (
                          <div className="text-sm font-semibold text-white/90">
                            {item.title}
                          </div>
                        ) : null}
                        <p className="text-sm leading-5 text-white/70">
                          {item.body}
                        </p>
                        <CommentThread postType={item.type} postId={item.id} />
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

          {/* The real Trending Now / Iconic & Timeless content is only for
              members -- a logged-out visitor gets told it exists (the
              locked card above), not the content itself. */}
          {user && cultureMoments.length ? (
            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <div className="bwe-eyebrow">Culture &amp; Entertainment</div>
                <Link
                  href="/black-entertainment-news"
                  className="text-xs font-semibold text-[var(--accent)] hover:underline"
                >
                  See all →
                </Link>
              </div>

              {trendingNow.length ? (
                <div className="mb-6">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">
                    Trending Now
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {trendingNow.map((moment) => (
                      <MomentCard key={moment.id} moment={moment} />
                    ))}
                  </div>
                </div>
              ) : null}

              {iconicTimeless.length ? (
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">
                    Iconic &amp; Timeless
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {iconicTimeless.map((moment) => (
                      <MomentCard key={moment.id} moment={moment} />
                    ))}
                  </div>
                </div>
              ) : null}

              {!trendingNow.length && !iconicTimeless.length ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {cultureMoments.slice(0, 4).map((moment) => (
                    <MomentCard key={moment.id} moment={moment} />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
