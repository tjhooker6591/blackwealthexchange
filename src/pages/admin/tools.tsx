// src/pages/admin/tools.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

type ToolItemType = "page" | "api_get" | "api_post";
type ToolCategory =
  | "System"
  | "Directory"
  | "Marketplace"
  | "Jobs"
  | "Users"
  | "Affiliates"
  | "Content"
  | "Interns"
  | "Other";

type ToolItem = {
  id: string;
  type: ToolItemType;
  category: ToolCategory;
  label: string;
  path: string;
  notes?: string;
  method?: "GET" | "POST";
  sampleBody?: Record<string, any>;
};

type PingResult = {
  status: number | null;
  ok: boolean;
  at: number;
  error?: string;
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

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isApiPath(path: string) {
  return path.startsWith("/api/");
}

function userIsAdmin(user?: MeResponse["user"]) {
  if (!user) return false;
  if (user.isAdmin) return true;
  if (user.accountType === "admin") return true;
  if (user.role === "admin") return true;
  if (Array.isArray(user.roles) && user.roles.includes("admin")) return true;
  return false;
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "bad" | "warn" | "gold";
}) {
  const cls =
    tone === "good"
      ? "border-green-500/30 bg-green-500/10 text-green-200"
      : tone === "bad"
        ? "border-red-500/30 bg-red-500/10 text-red-200"
        : tone === "warn"
          ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-200"
          : tone === "gold"
            ? "border-yellow-500/30 bg-black/40 text-gold"
            : "border-gray-700 bg-black/20 text-gray-200";

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs",
        cls,
      )}
    >
      {children}
    </span>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-3">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

async function ping(url: string): Promise<PingResult> {
  try {
    const res = await fetch(url, {
      credentials: "include",
      cache: "no-store",
    });

    return {
      status: res.status,
      ok: res.ok || res.status === 304,
      at: Date.now(),
    };
  } catch (e: any) {
    return {
      status: null,
      ok: false,
      at: Date.now(),
      error: e?.message || "Network error",
    };
  }
}

export default function AdminToolsPage() {
  const router = useRouter();

  const ITEMS: ToolItem[] = useMemo(
    () => [
      // Pages (admin)
      {
        id: "p-health",
        type: "page",
        category: "System",
        label: "Health Check",
        path: "/admin/health",
        method: "GET",
      },
      {
        id: "p-dashboard",
        type: "page",
        category: "System",
        label: "Admin Dashboard",
        path: "/admin/dashboard",
        method: "GET",
      },
      {
        id: "p-dir-approvals",
        type: "page",
        category: "Directory",
        label: "Directory Approvals",
        path: "/admin/directory-approvals",
        method: "GET",
      },
      {
        id: "p-biz-approvals",
        type: "page",
        category: "Directory",
        label: "Business Approvals",
        path: "/admin/business-approvals",
        method: "GET",
      },
      {
        id: "p-products-approvals",
        type: "page",
        category: "Marketplace",
        label: "Product Approvals",
        path: "/admin/product-approvals",
        method: "GET",
      },
      {
        id: "p-featured-products",
        type: "page",
        category: "Marketplace",
        label: "Featured Products",
        path: "/admin/featured-products",
        method: "GET",
      },
      {
        id: "p-inventory",
        type: "page",
        category: "Marketplace",
        label: "Inventory Report",
        path: "/admin/inventory-report",
        method: "GET",
      },
      {
        id: "p-job-approvals",
        type: "page",
        category: "Jobs",
        label: "Job Approvals",
        path: "/admin/job-approvals",
        method: "GET",
      },
      {
        id: "p-users",
        type: "page",
        category: "Users",
        label: "User Management",
        path: "/admin/user-management",
        method: "GET",
      },
      {
        id: "p-affiliates",
        type: "page",
        category: "Affiliates",
        label: "Affiliates",
        path: "/admin/affiliates",
        method: "GET",
      },
      {
        id: "p-affiliate-payouts",
        type: "page",
        category: "Affiliates",
        label: "Affiliate Payouts",
        path: "/admin/affiliate-payouts",
        method: "GET",
      },
      {
        id: "p-affiliate-attribution",
        type: "page",
        category: "Affiliates",
        label: "Affiliate Attribution",
        path: "/admin/affiliate-attribution",
        method: "GET",
      },
      {
        id: "p-consulting-leads",
        type: "page",
        category: "Consulting",
        label: "Consulting Leads",
        path: "/admin/consulting-leads",
        method: "GET",
      },
      {
        id: "p-content",
        type: "page",
        category: "Content",
        label: "Content Moderation",
        path: "/admin/content-moderation",
        method: "GET",
      },
      {
        id: "p-analytics",
        type: "page",
        category: "Other",
        label: "Analytics",
        path: "/admin/analytics",
        method: "GET",
      },
      {
        id: "p-intern-apps",
        type: "page",
        category: "Interns",
        label: "Intern Applications",
        path: "/admin/intern-applications",
        method: "GET",
      },

      // Pages (intern)
      {
        id: "p-intern-welcome",
        type: "page",
        category: "Interns",
        label: "Intern Welcome",
        path: "/intern/welcome",
        method: "GET",
        notes: "Not an admin route.",
      },
      {
        id: "p-intern-tasks",
        type: "page",
        category: "Interns",
        label: "Intern Tasks",
        path: "/intern/tasks",
        method: "GET",
        notes: "Not an admin route.",
      },

      // APIs (GET)
      {
        id: "a-me",
        type: "api_get",
        category: "System",
        label: "Auth: /api/auth/me",
        path: "/api/auth/me",
        method: "GET",
        notes: "Primary custom auth session endpoint.",
      },
      {
        id: "a-stats",
        type: "api_get",
        category: "System",
        label: "Admin Stats",
        path: "/api/admin/dashboard-stats",
        method: "GET",
      },
      {
        id: "a-dir-slots",
        type: "api_get",
        category: "Directory",
        label: "Directory Slots",
        path: "/api/admin/directory-slots",
        method: "GET",
      },
      {
        id: "a-consult",
        type: "api_get",
        category: "Other",
        label: "Consulting Interests",
        path: "/api/admin/consulting-interests",
        method: "GET",
      },
      {
        id: "a-dir-listings",
        type: "api_get",
        category: "Directory",
        label: "Directory Listings",
        path: "/api/admin/get-directory-listings",
        method: "GET",
      },
      {
        id: "a-users",
        type: "api_get",
        category: "Users",
        label: "Users",
        path: "/api/admin/users",
        method: "GET",
      },
      {
        id: "a-get-payouts",
        type: "api_get",
        category: "Affiliates",
        label: "Get Payouts",
        path: "/api/admin/get-payouts",
        method: "GET",
      },
      {
        id: "a-inventory-api",
        type: "api_get",
        category: "Marketplace",
        label: "Inventory API",
        path: "/api/admin/inventory",
        method: "GET",
      },
      {
        id: "a-products-api",
        type: "api_get",
        category: "Marketplace",
        label: "Products API",
        path: "/api/admin/products",
        method: "GET",
      },
      {
        id: "a-featured-products-api",
        type: "api_get",
        category: "Marketplace",
        label: "Featured Products API",
        path: "/api/admin/featured-products",
        method: "GET",
      },
      {
        id: "a-pending-biz",
        type: "api_get",
        category: "Directory",
        label: "Pending Businesses",
        path: "/api/admin/get-pending-businesses",
        method: "GET",
      },
      {
        id: "a-pending-jobs",
        type: "api_get",
        category: "Jobs",
        label: "Pending Jobs",
        path: "/api/admin/get-pending-jobs",
        method: "GET",
      },
      {
        id: "a-pending-products",
        type: "api_get",
        category: "Marketplace",
        label: "Pending Products",
        path: "/api/admin/get-pending-products",
        method: "GET",
      },
      {
        id: "a-intern-apps",
        type: "api_get",
        category: "Interns",
        label: "Intern Applications API",
        path: "/api/admin/intern-applications",
        method: "GET",
      },
      {
        id: "a-run-cron",
        type: "api_get",
        category: "Directory",
        label: "Run Directory Cron",
        path: "/api/admin/run-directory-cron",
        method: "GET",
        notes: "Use carefully. This may update data in bulk.",
      },

      // APIs (POST)
      {
        id: "x-approve-dir",
        type: "api_post",
        category: "Directory",
        label: "Approve Directory Listing",
        path: "/api/admin/approve-directory-listing",
        method: "POST",
        sampleBody: { listingId: "<mongo_id>" },
      },
      {
        id: "x-expire-dir",
        type: "api_post",
        category: "Directory",
        label: "Expire Directory Listing",
        path: "/api/admin/expire-directory-listing",
        method: "POST",
        sampleBody: { listingId: "<mongo_id>" },
      },
      {
        id: "x-approve-business",
        type: "api_post",
        category: "Directory",
        label: "Approve Business",
        path: "/api/admin/approve-business",
        method: "POST",
        sampleBody: { businessId: "<mongo_id>" },
      },
      {
        id: "x-approve-product",
        type: "api_post",
        category: "Marketplace",
        label: "Approve Product",
        path: "/api/admin/approve-product",
        method: "POST",
        sampleBody: { productId: "<mongo_id>" },
      },
      {
        id: "x-feature-product",
        type: "api_post",
        category: "Marketplace",
        label: "Feature / Unfeature Product",
        path: "/api/admin/feature-product",
        method: "POST",
        sampleBody: { productId: "<mongo_id>", isFeatured: true },
      },
      {
        id: "x-complete-payout",
        type: "api_post",
        category: "Affiliates",
        label: "Complete Affiliate Payout",
        path: "/api/admin/complete-affiliate-payout",
        method: "POST",
        sampleBody: { payoutId: "<mongo_id>" },
      },
    ],
    [],
  );

  const [tab, setTab] = useState<ToolItemType | "all">("all");
  const [category, setCategory] = useState<ToolCategory | "all">("all");
  const [query, setQuery] = useState("");

  const [baseline, setBaseline] = useState<Record<string, PingResult>>({});
  const [baselineLoading, setBaselineLoading] = useState(false);
  const [pings, setPings] = useState<Record<string, PingResult>>({});

  const [mounted, setMounted] = useState(false);
  const [clientNow, setClientNow] = useState("");
  const [loading, setLoading] = useState(true);

  const counts = useMemo(() => {
    const c = { page: 0, api_get: 0, api_post: 0, all: ITEMS.length };
    for (const i of ITEMS) c[i.type] += 1;
    return c;
  }, [ITEMS]);

  const categories: Array<ToolCategory | "all"> = useMemo(
    () => [
      "all",
      "System",
      "Directory",
      "Marketplace",
      "Jobs",
      "Users",
      "Affiliates",
      "Content",
      "Interns",
      "Other",
    ],
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return ITEMS.filter((i) => {
      if (tab !== "all" && i.type !== tab) return false;
      if (category !== "all" && i.category !== category) return false;
      if (!q) return true;

      const hay =
        `${i.label} ${i.path} ${i.category} ${i.type} ${i.notes || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [ITEMS, tab, category, query]);

  const baselineOk = useMemo(() => {
    const a = baseline["/api/auth/me"];
    const s = baseline["/api/admin/dashboard-stats"];
    return !!a?.ok && !!s?.ok;
  }, [baseline]);

  const runBaseline = useCallback(async () => {
    setBaselineLoading(true);

    const [me, stats] = await Promise.all([
      ping("/api/auth/me"),
      ping("/api/admin/dashboard-stats"),
    ]);

    setBaseline({
      "/api/auth/me": me,
      "/api/admin/dashboard-stats": stats,
    });

    setBaselineLoading(false);
    setClientNow(new Date().toLocaleString());
  }, []);

  useEffect(() => {
    let mountedLocal = true;

    const checkAdmin = async () => {
      try {
        const sessionRes = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        if (!sessionRes.ok) {
          router.replace("/login?redirect=/admin/tools");
          return;
        }

        const sessionData: MeResponse = await sessionRes
          .json()
          .catch(() => ({}));

        if (!userIsAdmin(sessionData.user)) {
          router.replace("/");
          return;
        }

        if (!mountedLocal) return;

        setMounted(true);
        setClientNow(new Date().toLocaleString());
        await runBaseline();
      } finally {
        if (mountedLocal) setLoading(false);
      }
    };

    checkAdmin();

    return () => {
      mountedLocal = false;
    };
  }, [router, runBaseline]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  const pingItem = async (item: ToolItem) => {
    if (item.type === "api_post") {
      alert(
        "This is a POST action endpoint. Use the sample curl/JSON instead.",
      );
      return;
    }

    const r = await ping(item.path);
    setPings((prev) => ({ ...prev, [item.id]: r }));
  };

  if (loading) {
    return <p className="p-8 text-white">Loading admin tools...</p>;
  }

  return (
    <>
      <Head>
        <title>Admin | Tools</title>
      </Head>

      <div className="min-h-screen bg-gray-900 p-6 text-white md:p-10">
        <header className="mb-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gold">Admin Tools</h1>
              <p className="mt-2 text-gray-400">
                One launcher for admin pages, protected APIs, and quick route
                checks.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/admin/dashboard"
                className="rounded border border-gray-700 bg-gray-800 px-4 py-2 text-sm hover:bg-gray-700"
              >
                ← Back to Admin
              </Link>

              <button
                onClick={runBaseline}
                className="rounded bg-gold px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-400"
                disabled={baselineLoading}
              >
                {baselineLoading ? "Checking…" : "Run Baseline Check"}
              </button>
            </div>
          </div>

          <div
            className={cx(
              "mt-6 rounded-xl border p-4",
              baselineOk
                ? "border-green-500/30 bg-green-500/10"
                : "border-yellow-500/20 bg-gray-800",
            )}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-semibold">
                  Baseline:{" "}
                  {baselineOk ? (
                    <span className="text-green-200">STABLE</span>
                  ) : (
                    <span className="text-yellow-200">CHECK</span>
                  )}
                </div>
                <div className="mt-1 text-xs text-gray-300">
                  Green means: you’re logged in and key admin API checks are
                  passing.
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge tone={baseline["/api/auth/me"]?.ok ? "good" : "bad"}>
                  /api/auth/me: {baseline["/api/auth/me"]?.status ?? "—"}
                </Badge>
                <Badge
                  tone={
                    baseline["/api/admin/dashboard-stats"]?.ok ? "good" : "bad"
                  }
                >
                  /api/admin/dashboard-stats:{" "}
                  {baseline["/api/admin/dashboard-stats"]?.status ?? "—"}
                </Badge>
                <Badge tone="gold">{mounted ? clientNow : "—"}</Badge>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
            <Link
              href="/admin/health"
              className="rounded-xl border border-gray-700 bg-gray-800 p-4 transition hover:bg-gray-700"
            >
              <div className="font-semibold text-gold">Open Health</div>
              <div className="mt-1 text-xs text-gray-400">/admin/health</div>
            </Link>

            <Link
              href="/admin/dashboard"
              className="rounded-xl border border-gray-700 bg-gray-800 p-4 transition hover:bg-gray-700"
            >
              <div className="font-semibold text-gold">Open Dashboard</div>
              <div className="mt-1 text-xs text-gray-400">/admin/dashboard</div>
            </Link>

            <Link
              href="/intern/welcome"
              className="rounded-xl border border-gray-700 bg-gray-800 p-4 transition hover:bg-gray-700"
            >
              <div className="font-semibold text-gold">Intern Welcome</div>
              <div className="mt-1 text-xs text-gray-400">/intern/welcome</div>
            </Link>

            <Link
              href="/intern/tasks"
              className="rounded-xl border border-gray-700 bg-gray-800 p-4 transition hover:bg-gray-700"
            >
              <div className="font-semibold text-gold">Intern Tasks</div>
              <div className="mt-1 text-xs text-gray-400">/intern/tasks</div>
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="md:col-span-5">
              <label className="mb-1 block text-xs text-gray-400">Search</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by label, route, notes..."
                className="w-full rounded border border-gray-700 bg-black/40 px-4 py-2 text-sm outline-none focus:border-gold/60"
              />
            </div>

            <div className="md:col-span-4">
              <label className="mb-1 block text-xs text-gray-400">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full rounded border border-gray-700 bg-black/40 px-4 py-2 text-sm outline-none focus:border-gold/60"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "all" ? "All categories" : c}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="mb-1 block text-xs text-gray-400">Type</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTab("all")}
                  className={cx(
                    "rounded-full border px-4 py-2 text-xs transition",
                    tab === "all"
                      ? "border-gold bg-gold text-black"
                      : "border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700",
                  )}
                >
                  All ({counts.all})
                </button>
                <button
                  onClick={() => setTab("page")}
                  className={cx(
                    "rounded-full border px-4 py-2 text-xs transition",
                    tab === "page"
                      ? "border-gold bg-gold text-black"
                      : "border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700",
                  )}
                >
                  Pages ({counts.page})
                </button>
                <button
                  onClick={() => setTab("api_get")}
                  className={cx(
                    "rounded-full border px-4 py-2 text-xs transition",
                    tab === "api_get"
                      ? "border-gold bg-gold text-black"
                      : "border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700",
                  )}
                >
                  APIs GET ({counts.api_get})
                </button>
                <button
                  onClick={() => setTab("api_post")}
                  className={cx(
                    "rounded-full border px-4 py-2 text-xs transition",
                    tab === "api_post"
                      ? "border-gold bg-gold text-black"
                      : "border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700",
                  )}
                >
                  Actions POST ({counts.api_post})
                </button>
              </div>
            </div>
          </div>
        </header>

        <section className="mb-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <StatPill label="Visible items" value={String(filtered.length)} />
            <StatPill label="Pages in list" value={String(counts.page)} />
            <StatPill label="GET APIs in list" value={String(counts.api_get)} />
            <StatPill
              label="POST actions in list"
              value={String(counts.api_post)}
            />
          </div>
        </section>

        <section className="rounded border border-gray-700 bg-gray-800 p-4">
          <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-bold text-gold">Launcher List</h2>
            <div className="text-xs text-gray-400">
              Use Ping for GET/page checks. For POST actions, copy the sample
              payload or curl.
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gold">
                  <th className="px-3 py-2 text-left">Label</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Category</th>
                  <th className="px-3 py-2 text-left">Route</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const pr = pings[item.id];
                  const statusTone =
                    item.type === "api_post"
                      ? "warn"
                      : pr
                        ? pr.ok
                          ? "good"
                          : "bad"
                        : "neutral";

                  return (
                    <tr
                      key={item.id}
                      className="align-top border-b border-gray-700/60"
                    >
                      <td className="px-3 py-3">
                        <div className="font-semibold text-white">
                          {item.label}
                        </div>
                        {item.notes ? (
                          <div className="mt-1 text-xs text-gray-400">
                            {item.notes}
                          </div>
                        ) : null}
                      </td>

                      <td className="px-3 py-3">
                        <Badge
                          tone={
                            item.type === "page"
                              ? "gold"
                              : item.type === "api_get"
                                ? "neutral"
                                : "warn"
                          }
                        >
                          {item.type === "page"
                            ? "PAGE"
                            : item.type === "api_get"
                              ? "API GET"
                              : "ACTION POST"}
                        </Badge>
                      </td>

                      <td className="px-3 py-3">
                        <Badge tone="neutral">{item.category}</Badge>
                      </td>

                      <td className="px-3 py-3">
                        <code className="text-xs text-gray-200">
                          {item.path}
                        </code>
                        {item.type === "api_post" && item.sampleBody ? (
                          <div className="mt-2 rounded border border-gray-700 bg-black/30 p-2">
                            <div className="mb-1 text-xs text-gray-400">
                              Sample body:
                            </div>
                            <pre className="overflow-auto text-xs text-gray-200">
                              {JSON.stringify(item.sampleBody, null, 2)}
                            </pre>
                          </div>
                        ) : null}
                      </td>

                      <td className="px-3 py-3">
                        <Badge tone={statusTone as any}>
                          {item.type === "api_post"
                            ? "POST only"
                            : pr
                              ? (pr.status ?? "ERR")
                              : "—"}
                        </Badge>

                        {pr?.error ? (
                          <div className="mt-1 text-xs text-red-200">
                            {pr.error}
                          </div>
                        ) : null}

                        {pr?.at ? (
                          <div className="mt-1 text-[11px] text-gray-500">
                            {new Date(pr.at).toLocaleTimeString()}
                          </div>
                        ) : null}
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          {item.type !== "api_post" ? (
                            isApiPath(item.path) ? (
                              <a
                                href={item.path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded border border-gray-700 bg-gray-900 px-3 py-1 text-xs hover:bg-gray-700"
                              >
                                Open
                              </a>
                            ) : (
                              <Link
                                href={item.path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded border border-gray-700 bg-gray-900 px-3 py-1 text-xs hover:bg-gray-700"
                              >
                                Open
                              </Link>
                            )
                          ) : (
                            <button
                              onClick={() => copy(item.path)}
                              className="rounded border border-gray-700 bg-gray-900 px-3 py-1 text-xs hover:bg-gray-700"
                            >
                              Copy URL
                            </button>
                          )}

                          <button
                            onClick={() => copy(item.path)}
                            className="rounded border border-gray-700 bg-gray-900 px-3 py-1 text-xs hover:bg-gray-700"
                          >
                            Copy
                          </button>

                          <button
                            onClick={() => pingItem(item)}
                            className="rounded border border-gray-700 bg-gray-900 px-3 py-1 text-xs hover:bg-gray-700"
                          >
                            Ping
                          </button>

                          {item.type === "api_post" ? (
                            <button
                              onClick={() => {
                                const curl = `curl -X POST "http://localhost:3000${item.path}" -H "Content-Type: application/json" -d '${JSON.stringify(
                                  item.sampleBody || {},
                                  null,
                                  0,
                                )}'`;
                                copy(curl);
                                alert("Copied sample curl to clipboard.");
                              }}
                              className="rounded border border-gray-700 bg-gray-900 px-3 py-1 text-xs hover:bg-gray-700"
                            >
                              Copy curl
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-400">
                      No matches. Try clearing search or filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="mt-10 text-center text-xs text-gray-500">
          Bookmark <span className="text-gold">/admin/tools</span> and start
          each admin session with{" "}
          <span className="text-gold">Run Baseline Check</span>.
        </footer>
      </div>
    </>
  );
}
