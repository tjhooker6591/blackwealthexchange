// src/pages/u/[userId].tsx
//
// BWE Pulse Phase 2 -- a member's public profile. Only ever renders if the
// account holder opted in via profileVisibility === "public" (see PATCH
// /api/profile) -- otherwise a plain 404, same as if the id didn't exist
// at all, so private accounts can't be distinguished from nonexistent ones.

import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { findPersonById } from "@/lib/network/personLookup";
import { nameFromDoc, normalizeAsset } from "@/pages/api/profile";
import { canonicalUrl } from "@/lib/seo";

type Props = {
  userId: string;
  name: string;
  bio: string;
  avatarUrl: string | null;
  memberSince: string | null;
};

export const getServerSideProps: GetServerSideProps<Props> = async ({
  params,
}) => {
  const userId = String(params?.userId || "").trim();
  if (!userId) return { notFound: true };

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const found = await findPersonById(db, userId);
    if (!found || found.doc.profileVisibility !== "public") {
      return { notFound: true };
    }

    const avatar = normalizeAsset(found.doc, "avatar");
    return {
      props: {
        userId: String(found.doc._id),
        name: nameFromDoc(found.doc) || "BWE Member",
        bio: found.doc.bio || "",
        avatarUrl: avatar?.url || null,
        memberSince:
          found.doc.createdAt instanceof Date
            ? found.doc.createdAt.toISOString()
            : found.doc.createdAt || null,
      },
    };
  } catch {
    return { notFound: true };
  }
};

const PublicProfilePage: NextPage<Props> = ({
  userId,
  name,
  bio,
  avatarUrl,
  memberSince,
}) => {
  const { user } = useAuth({ silentOnPublic: false });
  const [following, setFollowing] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/user/follow?userId=${encodeURIComponent(userId)}`, {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : { following: false, count: 0 }))
      .then((data) => {
        setFollowing(Boolean(data.following));
        setCount(typeof data.count === "number" ? data.count : null);
      })
      .catch(() => null);
  }, [userId]);

  async function toggleFollow() {
    if (!user) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/user/follow", {
        method: following ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setFollowing(Boolean(data.following));
        if (typeof data.count === "number") setCount(data.count);
      }
    } finally {
      setBusy(false);
    }
  }

  const isSelf = user?._id === userId;
  const canonical = canonicalUrl(`/u/${userId}`);

  return (
    <>
      <Head>
        <title>{name} | Black Wealth Exchange</title>
        <meta name="robots" content="noindex,follow" />
        <link rel="canonical" href={canonical} />
      </Head>
      <div className="min-h-screen bg-black text-white">
        <div className="bwe-section-wrap py-8 sm:py-10 max-w-2xl">
          <div className="flex items-start gap-4">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={name}
                className="h-16 w-16 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/10 text-xl font-bold text-white/70">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="bwe-display-title text-2xl sm:text-3xl">{name}</h1>
              <p className="mt-1 text-sm text-white/50">
                {count !== null
                  ? `${count} follower${count === 1 ? "" : "s"}`
                  : ""}
                {memberSince
                  ? ` · Member since ${new Date(memberSince).getFullYear()}`
                  : ""}
              </p>
            </div>
          </div>

          {bio ? (
            <p className="mt-4 text-sm leading-6 text-white/75">{bio}</p>
          ) : null}

          {!isSelf ? (
            <button
              type="button"
              onClick={toggleFollow}
              disabled={busy}
              className="mt-6 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-extrabold text-black disabled:opacity-50"
            >
              {following ? "Following" : "Follow"}
            </button>
          ) : (
            <p className="mt-6 text-xs text-white/45">
              This is your public profile.
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default PublicProfilePage;
