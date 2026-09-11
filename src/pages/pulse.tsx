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
  discover: {
    state: "PERSONALIZED" | "TRENDING_FALLBACK" | "INSUFFICIENT_DATA";
    businesses: DiscoverBusiness[];
  };
};

type Comment = {
  id: string;
  authorUserId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  body: string;
  createdAt: string | null;
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

function Avatar({
  name,
  url,
  small = false,
}: {
  name: string;
  url: string | null;
  small?: boolean;
}) {
  // Tailwind's JIT scanner needs literal class strings, not interpolated
  // ones -- `h-${size}` would never actually get generated, so this
  // branches between two fully-literal class strings instead.
  const sizeClass = small ? "h-6 w-6" : "h-9 w-9";
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        className={`${sizeClass} shrink-0 rounded-full object-cover`}
      />
    );
  }
  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white/70`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function CommentThread({
  postType,
  postId,
}: {
  postType: string;
  postId: string;
}) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [state, setState] = useState<string | null>(null);

  const load = () => {
    fetch(
      `/api/pulse/comments?postType=${encodeURIComponent(postType)}&postId=${encodeURIComponent(postId)}`,
      { credentials: "include" },
    )
      .then((r) => (r.ok ? r.json() : { comments: [] }))
      .then((data) => setComments(data?.comments || []))
      .catch(() => setComments([]));
  };

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && comments === null) load();
  }

  async function handleComment() {
    setPosting(true);
    setState(null);
    try {
      const res = await fetch("/api/pulse/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ postType, postId, body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState(data?.error || "Couldn't comment. Please try again.");
        return;
      }
      setBody("");
      load();
    } catch {
      setState("Couldn't comment. Please try again.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="mt-1 border-t border-white/10 pt-2">
      <button
        type="button"
        onClick={toggle}
        className="text-xs font-semibold text-white/50 hover:text-white/80"
      >
        {open
          ? "Hide comments"
          : comments
            ? `${comments.length} comment${comments.length === 1 ? "" : "s"}`
            : "Comments"}
      </button>

      {open ? (
        <div className="mt-2 flex flex-col gap-2">
          {comments === null ? (
            <div className="text-xs text-white/40">Loading…</div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex items-start gap-2">
                <Avatar name={c.authorName} url={c.authorAvatarUrl} small />
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-white/85">
                    {c.authorName}
                  </span>{" "}
                  <span className="text-xs text-white/40">
                    {timeAgo(c.createdAt)}
                  </span>
                  <p className="text-sm text-white/70">{c.body}</p>
                </div>
              </div>
            ))
          )}

          <div className="mt-1 flex items-center gap-2">
            <input
              type="text"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write a comment…"
              maxLength={500}
              className="bwe-input w-full text-sm"
            />
            <button
              type="button"
              onClick={handleComment}
              disabled={posting || !body.trim()}
              className="shrink-0 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {posting ? "…" : "Send"}
            </button>
          </div>
          {state ? (
            <span className="text-xs text-white/60">
              {state}{" "}
              {state.startsWith("Make your profile") ? (
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
      ) : null}
    </div>
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

  const canonical = canonicalUrl("/pulse");

  const loadFeed = () => {
    if (!user) return;
    setLoading(true);
    fetch("/api/pulse/feed", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: FeedResponse) => setFeed(data))
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

                {feed?.followingCount === 0 ? (
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
                ) : !feed?.items?.length ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
                    No updates yet from businesses or members you follow. Check
                    back soon, or browse what&apos;s trending on the right.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {feed.items.map((item) => (
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
        </div>
      </div>
    </>
  );
}
