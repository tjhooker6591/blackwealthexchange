// src/pages/admin/content-moderation.tsx
"use client";

import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

type FlaggedContentItem = {
  id: number | string;
  title: string;
  type: string;
  flaggedBy: string;
};

type MeResponse = {
  user?: {
    email?: string;
    accountType?: string;
    role?: string;
    isAdmin?: boolean;
    roles?: string[];
  };
};

function userIsAdmin(user?: MeResponse["user"]) {
  if (!user) return false;
  if (user.isAdmin) return true;
  if (user.accountType === "admin") return true;
  if (user.role === "admin") return true;
  if (Array.isArray(user.roles) && user.roles.includes("admin")) return true;
  return false;
}

export default function ContentModeration() {
  const router = useRouter();
  const [checkingAccess, setCheckingAccess] = useState(true);

  // Placeholder data until moderation API is wired
  const flaggedContent: FlaggedContentItem[] = [
    {
      id: 1,
      title: "Investment Tips 101",
      type: "Article",
      flaggedBy: "User123",
    },
    {
      id: 2,
      title: "Community Post: Funding Help",
      type: "Post",
      flaggedBy: "User456",
    },
  ];

  useEffect(() => {
    let mounted = true;

    const checkAdmin = async () => {
      try {
        const sessionRes = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        if (!sessionRes.ok) {
          router.replace("/login?redirect=/admin/content-moderation");
          return;
        }

        const sessionData: MeResponse = await sessionRes
          .json()
          .catch(() => ({}));

        if (!userIsAdmin(sessionData.user)) {
          router.replace("/");
          return;
        }
      } catch {
        router.replace("/");
        return;
      } finally {
        if (mounted) setCheckingAccess(false);
      }
    };

    checkAdmin();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (checkingAccess) {
    return <p className="p-8 text-white">Loading moderation dashboard...</p>;
  }

  return (
    <>
      <Head>
        <title>Admin | Content Moderation</title>
      </Head>

      <div className="min-h-screen bg-black text-white p-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-gold">
                Content Moderation
              </h1>
              <p className="text-sm text-gray-400">
                Review flagged content and moderation workflows.
              </p>
            </div>

            <Link
              href="/admin/dashboard"
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
            >
              Back to Admin Dashboard
            </Link>
          </div>

          <div className="mb-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-sm text-yellow-200">
            This moderation page is currently a UI placeholder. Approve/Remove
            actions are not wired to a backend moderation API yet.
          </div>

          {flaggedContent.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-300">
              No flagged content at this time. 🎉
            </div>
          ) : (
            <ul className="space-y-4">
              {flaggedContent.map((content) => (
                <li
                  key={content.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <p className="text-lg font-semibold text-white">
                    {content.title}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {content.type} • Flagged by: {content.flaggedBy}
                  </p>

                  <div className="mt-3 flex gap-2">
                    <button
                      className="rounded bg-green-600 px-3 py-1 text-black opacity-60 cursor-not-allowed"
                      disabled
                    >
                      Approve
                    </button>
                    <button
                      className="rounded bg-red-600 px-3 py-1 text-black opacity-60 cursor-not-allowed"
                      disabled
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
