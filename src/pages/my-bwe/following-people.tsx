// src/pages/my-bwe/following-people.tsx
//
// BWE Pulse Phase 2 -- list of people the caller follows. Mirrors
// src/pages/my-bwe/following.tsx (businesses) exactly.

import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import useAuth from "@/hooks/useAuth";
import { canonicalUrl } from "@/lib/seo";

type FollowedPerson = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  followedAt: string | null;
};

export default function FollowingPeoplePage() {
  const { user, loading: authLoading } = useAuth({ silentOnPublic: false });
  const [items, setItems] = useState<FollowedPerson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetch("/api/user/follow?mine=1", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { people: [] }))
      .then((data) => setItems(data?.people || []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [user]);

  const canonical = canonicalUrl("/my-bwe/following-people");

  return (
    <>
      <Head>
        <title>People You Follow | My BWE</title>
        <meta name="robots" content="noindex,follow" />
        <link rel="canonical" href={canonical} />
      </Head>
      <div className="min-h-screen bg-black text-white">
        <div className="bwe-section-wrap py-8 sm:py-10">
          <Link href="/my-bwe" className="bwe-open-link bwe-focus-ring">
            Back to My BWE
          </Link>
          <h1 className="bwe-display-title mt-3 text-3xl sm:text-4xl">
            People You Follow
          </h1>

          {authLoading || loading ? (
            <div className="mt-8 text-white/60">Loading…</div>
          ) : !user ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
              <Link
                href="/login?next=/my-bwe/following-people"
                className="text-[var(--accent)] underline"
              >
                Log in
              </Link>
            </div>
          ) : items.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
              You&apos;re not following any members yet. Members who make their
              profile public can be followed from their profile page.
            </div>
          ) : (
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <Link
                  key={item.userId}
                  href={`/u/${item.userId}`}
                  className="bwe-grid-card bwe-focus-ring flex items-center gap-3 p-4"
                >
                  {item.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.avatarUrl}
                      alt={item.name}
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white/70">
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="bwe-card-title">{item.name}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
