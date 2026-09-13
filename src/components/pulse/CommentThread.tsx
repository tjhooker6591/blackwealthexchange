"use client";

// Shared comment thread for a BWE Pulse post (business_updates or
// member_posts, keyed generically via postType/postId -- see
// src/pages/api/pulse/comments.ts). Extracted out of src/pages/pulse.tsx
// (2026-09-11) so it can also render on the business profile page
// (BusinessEngagement.tsx) and the member public profile page
// (src/pages/u/[userId].tsx) -- comments made from Pulse were only ever
// visible inside Pulse itself, not next to the actual post they're on.
//
// Paginated, newest-first (2026-09-12): a post used to return every
// comment it ever had in one call, which doesn't scale once a popular
// business or post has hundreds of them. Also adds a single-level
// business reply (like a Yelp/Google review reply) -- see
// src/pages/api/pulse/comments/reply.ts.

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "./Avatar";
import { timeAgo } from "./timeAgo";
import useAuth from "@/hooks/useAuth";

const PAGE_SIZE = 5;

type BusinessReply = {
  body: string;
  createdAt: string | null;
};

type Comment = {
  id: string;
  authorUserId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  body: string;
  createdAt: string | null;
  businessReply: BusinessReply | null;
};

function BusinessReplyBlock({
  comment,
  canReply,
  onChanged,
}: {
  comment: Comment;
  canReply: boolean;
  onChanged: (reply: BusinessReply | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.businessReply?.body || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/pulse/comments/reply", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ commentId: comment.id, body: draft }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Couldn't save reply. Please try again.");
        return;
      }
      onChanged(data.businessReply);
      setEditing(false);
    } catch {
      setError("Couldn't save reply. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/pulse/comments/reply", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ commentId: comment.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Couldn't remove reply. Please try again.");
        return;
      }
      onChanged(null);
      setDraft("");
    } catch {
      setError("Couldn't remove reply. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (comment.businessReply && !editing) {
    return (
      <div className="ml-6 mt-1.5 rounded-lg border-l-2 border-[var(--accent)]/40 bg-white/[0.03] px-2.5 py-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[var(--accent)]">
            Business reply
          </span>
          <span className="text-[10px] text-white/40">
            {timeAgo(comment.businessReply.createdAt)}
          </span>
        </div>
        <p className="text-sm text-white/70">{comment.businessReply.body}</p>
        {canReply ? (
          <div className="mt-1 flex gap-3">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-[11px] font-semibold text-white/50 hover:text-white/80"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="text-[11px] font-semibold text-white/50 hover:text-white/80"
            >
              Remove
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  if (!canReply) return null;

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="ml-6 mt-1 text-[11px] font-semibold text-white/50 hover:text-white/80"
      >
        Reply
      </button>
    );
  }

  return (
    <div className="ml-6 mt-1.5 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Reply as this business…"
          maxLength={500}
          className="bwe-input w-full text-sm"
        />
        <button
          type="button"
          onClick={submit}
          disabled={busy || !draft.trim()}
          className="shrink-0 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          {busy ? "…" : "Send"}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setDraft(comment.businessReply?.body || "");
          }}
          className="shrink-0 text-xs text-white/50 hover:text-white/80"
        >
          Cancel
        </button>
      </div>
      {error ? <span className="text-xs text-white/60">{error}</span> : null}
    </div>
  );
}

export default function CommentThread({
  postType,
  postId,
}: {
  postType: string;
  postId: string;
}) {
  const { user, loading: authLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [canReply, setCanReply] = useState(false);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [state, setState] = useState<string | null>(null);
  const canComment = !!user && user.profileVisibility === "public";

  const fetchPage = async (before?: string | null) => {
    const params = new URLSearchParams({
      postType,
      postId,
      limit: String(PAGE_SIZE),
    });
    if (before) params.set("before", before);
    const res = await fetch(`/api/pulse/comments?${params.toString()}`, {
      credentials: "include",
    });
    return res.ok
      ? res.json()
      : {
          comments: [],
          totalCount: 0,
          hasMore: false,
          nextCursor: null,
          canReply: false,
        };
  };

  const load = () => {
    fetchPage(null)
      .then((data) => {
        setComments(data?.comments || []);
        setTotalCount(data?.totalCount || 0);
        setHasMore(!!data?.hasMore);
        setCursor(data?.nextCursor || null);
        setCanReply(!!data?.canReply);
      })
      .catch(() => setComments([]));
  };

  async function loadMore() {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const data = await fetchPage(cursor);
      setComments((prev) => [...(prev || []), ...(data?.comments || [])]);
      setHasMore(!!data?.hasMore);
      setCursor(data?.nextCursor || null);
    } finally {
      setLoadingMore(false);
    }
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && comments === null) load();
  }

  function updateReply(commentId: string, reply: BusinessReply | null) {
    setComments(
      (prev) =>
        prev?.map((c) =>
          c.id === commentId ? { ...c, businessReply: reply } : c,
        ) || null,
    );
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
            ? `${totalCount} comment${totalCount === 1 ? "" : "s"}`
            : "Comments"}
      </button>

      {open ? (
        <div className="mt-2 flex flex-col gap-3">
          {comments === null ? (
            <div className="text-xs text-white/40">Loading…</div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex flex-col gap-1">
                <div className="flex items-start gap-2">
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
                <BusinessReplyBlock
                  comment={c}
                  canReply={canReply}
                  onChanged={(reply) => updateReply(c.id, reply)}
                />
              </div>
            ))
          )}

          {hasMore ? (
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="self-start text-xs font-semibold text-white/50 hover:text-white/80"
            >
              {loadingMore ? "Loading…" : "Load earlier comments"}
            </button>
          ) : null}

          {authLoading ? null : !user ? (
            // Known upfront -- no point letting someone type a comment
            // only to reject it after they hit Send.
            <div className="text-xs text-white/50">
              <Link href="/login" className="text-[var(--accent)] underline">
                Log in
              </Link>{" "}
              to comment.
            </div>
          ) : !canComment ? (
            <div className="rounded-lg bg-white/5 px-3 py-2 text-xs text-white/60">
              Turn on your public profile to comment -- it just lets other
              members see your name next to what you write. Your resume, email,
              and phone stay private either way.{" "}
              <Link
                href="/profile"
                className="font-semibold text-[var(--accent)] underline"
              >
                Turn on in Profile settings
              </Link>
            </div>
          ) : (
            <>
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
                <span className="text-xs text-white/60">{state}</span>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
