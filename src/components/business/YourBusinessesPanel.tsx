// src/components/business/YourBusinessesPanel.tsx
//
// Shown at the top of the member dashboard for people who own businesses,
// so they reach the same Business Workspace a business login opens.

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Building2, ArrowRight } from "lucide-react";

type MyBusiness = { id: string; name: string; claimed: boolean };

export default function YourBusinessesPanel() {
  const [businesses, setBusinesses] = useState<MyBusiness[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/business/my-businesses", {
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.ok && Array.isArray(d.businesses)) setBusinesses(d.businesses);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  if (!businesses.length) return null;

  return (
    <div className="mx-auto max-w-6xl px-3 pt-4 sm:px-4 sm:pt-8">
      <section className="rounded-2xl border border-yellow-500/25 bg-yellow-500/[0.07] p-4 shadow-xl sm:p-5">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-yellow-300">
          <Building2 className="h-4 w-4" />
          Your businesses
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {businesses.map((b) => (
            <Link
              key={b.id}
              href={`/dashboard?businessId=${encodeURIComponent(b.id)}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 transition hover:bg-white/10"
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold text-white">
                  {b.name}
                </span>
                <span className="text-xs text-white/55">
                  Open Business Workspace
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-yellow-300" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
