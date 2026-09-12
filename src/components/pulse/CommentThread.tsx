"use client";

// Shared comment thread for a BWE Pulse post (business_updates or
// member_posts, keyed generically via postType/postId -- see
// src/pages/api/pulse/comments.ts). Extracted out of src/pages/pulse.tsx
// (2026-09-11) so it can also render on the business profile page
// (BusinessEngagement.tsx) and the member public profile page
// (src/pages/u/[userId].tsx) -- comments made from Pulse were only ever
// visible inside Pulse itself, not next to the actual post they're on.

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "./Avatar";
import { timeAgo } from "./timeAgo";
import useAuth from "@/hooks/useAuth";

type Comment = {
  id: string;
  authorUserId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  body: string;
  createdAt: string | null;
};

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
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [state, setState] = useState<string | null>(null);
  const canComment = !!user && user.profileVisibility === "public";

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
