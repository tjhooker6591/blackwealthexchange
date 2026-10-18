// src/components/business/ProfileViewersCard.tsx
//
// "Who viewed your business" card for the owner's dashboard and profile hub.
// Claimed listings see named viewers; unclaimed listings see the counts and
// a gentle invitation to claim to see who.

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Viewer = {
  name: string;
  avatarUrl: string | null;
  kind: "member" | "business" | "seller" | "employer";
  lastViewedAt: string;
};

type Data = {
  businessId: string;
  businessName: string;
  claimed: boolean;
  claimUrl: string | null;
  summary: {
    thisMonth: number;
    lastMonth: number;
    last30Days: number;
    namedViewersLast30Days: number;
    privateOrGuestLast30Days: number;
    viewers: Viewer[] | null;
  };
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

const KIND_LABEL: Record<Viewer["kind"], string> = {
  member: "Member",
  business: "Business",
  seller: "Seller",
  employer: "Employer",
};

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

export default function ProfileViewersCard({
  businessId,
  onLoaded,
}: {
  businessId?: string | null;
  // Lets the page react to whether the listing is claimed (e.g. enable the
  // Membership & report button) without a second request.
  onLoaded?: (info: { claimed: boolean; businessId: string }) => void;
}) {
  const [data, setData] = useState<Data | null>(null);
  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;

  useEffect(() => {
    const controller = new AbortController();
    const qs = businessId
      ? `?businessId=${encodeURIComponent(businessId)}`
      : "";
    fetch(`/api/business/profile-viewers${qs}`, {
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.ok) {
          setData(d);
          onLoadedRef.current?.({
            claimed: d.claimed === true,
            businessId: d.businessId,
          });
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [businessId]);

  if (!data) return null;
  const s = data.summary;
  const change = s.thisMonth - s.lastMonth;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-yellow-300">
            Who viewed your business
          </div>
          <h2 className="mt-1 text-lg font-extrabold text-white sm:text-xl">
            {plural(s.last30Days, "visit", "visits")} in the last 30 days
          </h2>
          <p className="mt-1 text-xs text-gray-300 sm:text-sm">
            This month: {s.thisMonth}
            {" · "}Last month: {s.lastMonth}
            {s.lastMonth > 0 || s.thisMonth > 0
              ? ` · ${change >= 0 ? "+" : ""}${change}`
              : ""}
          </p>
        </div>
      </div>

      {data.claimed ? (
        <div className="mt-4">
          {s.viewers && s.viewers.length ? (
            <ul className="divide-y divide-white/10">
              {s.viewers.map((v, i) => (
                <li
                  key={`${v.name}-${i}`}
                  className="flex items-center gap-3 py-2.5"
                >
                  {v.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.avatarUrl}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-500/15 text-sm font-bold text-yellow-200">
                      {v.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-white">
                      {v.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {KIND_LABEL[v.kind]} · {timeAgo(v.lastViewedAt)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-300">
              No signed-in members have viewed your page in the last 30 days
              yet.
            </p>
          )}
          {s.privateOrGuestLast30Days > 0 ? (
            <p className="mt-3 text-xs text-gray-400">
              +{" "}
              {plural(
                s.privateOrGuestLast30Days,
                "visit from someone who wasn't signed in or browses privately",
                "visits from people who weren't signed in or browse privately",
              )}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-yellow-500/25 bg-yellow-500/10 p-4">
          <p className="text-sm text-yellow-100">
            {s.namedViewersLast30Days > 0
              ? `${plural(s.namedViewersLast30Days, "Black Wealth Exchange member", "Black Wealth Exchange members")} looked at ${data.businessName} recently.`
              : `People are finding ${data.businessName} on Black Wealth Exchange.`}{" "}
            Claim your listing to see who&rsquo;s visiting, along with a monthly
            report on how your page is doing.
          </p>
          {data.claimUrl ? (
            <Link
              href={data.claimUrl}
              className="mt-3 inline-flex items-center justify-center rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-yellow-400"
            >
              See who viewed your business
            </Link>
          ) : null}
        </div>
      )}
    </section>
  );
}
