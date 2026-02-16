// src/pages/admin/tools.tsx
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

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

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
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
        cls
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
    const res = await fetch(url, { credentials: "include" });
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

function isInternalNextRoute(path: string) {
  // treat relative routes as internal Next routes (pages)
  return typeof path === "string" && path.startsWith("/");
}

export default function AdminToolsPage() {
  const ITEMS: ToolItem[] = useMemo(
    () => [
      // =======================
      // Pages (admin)
      // =======================
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
        id: "p-dir-duplicates",
        type: "page",
        category: "Directory",
        label: "Directory Duplicates (NOT BUILT YET)",
        path: "/admin/directory-duplicates",
        method: "GET",
        notes:
          "This page does not exist in src/pages/admin yet, so it will 404 until created.",
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
        id: "api-search-organizations",
        type: "api_get",
        category: "Directory",
        label: "Search Organizations (API)",
        path: "/api/searchOrganizations?status=pending&orgType=church&source=church_seed_20260211_032803&page=1&limit=20",
        notes:
          "Organizations search. Default is approved-only; use status=pending for admin review.",
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
        label: "Intern Applications (Admin)",
        path: "/admin/intern-applications",
        method: "GET",
      },

      // =======================
      // Pages (intern - NOT admin)
      // =======================
      {
        id: "p-intern-welcome",
        type: "page",
        category: "Interns",
        label: "Intern Welcome (public page)",
        path: "/intern/welcome",
        method: "GET",
        notes: "This is the intern landing page (not under /admin).",
      },
      {
        id: "p-intern-tasks",
        type: "page",
        category: "Interns",
        label: "Intern Tasks (public page)",
        path: "/intern/tasks",
        method: "GET",
        notes: "This is the intern tasks listing page (not under /admin).",
      },

      // =======================
      // APIs (GET)
      // =======================
      {
        id: "a-me",
        type: "api_get",
        category: "System",
        label: "Auth: /api/auth/me",
        path: "/api/auth/me",
        method: "GET",
        notes: "Your single source of truth for session/accountType.",
      },
      {
        id: "a-stats",
        type: "api_get",
        category: "System",
        label: "Admin Stats: dashboard-stats",
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
        id: "a-dir-listing-singular",
        type: "api_get",
        category: "Directory",
        label: "Directory Listings (current file: get-directory-listing)",
        path: "/api/admin/get-directory-listing",
        method: "GET",
        notes:
          "Your repo currently has get-directory-listing.ts (singular). If your UI calls /get-directory-listings it will 404 until you rename or update the fetch URL.",
      },

      {
        id: "a-users",
        type: "api_get",
        category: "Users",
        label: "Get Users",
        path: "/api/admin/get-users",
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
        label: "Inventory (API)",
        path: "/api/admin/inventory",
        method: "GET",
      },
      {
        id: "a-products-api",
        type: "api_get",
        category: "Marketplace",
        label: "Products (API)",
        path: "/api/admin/products",
        method: "GET",
      },
      {
        id: "a-featured-products-api",
        type: "api_get",
        category: "Marketplace",
        label: "Featured Products (API)",
        path: "/api/admin/featured-products",
        method: "GET",
      },

      {
        id: "a-unapproved-biz",
        type: "api_get",
        category: "Directory",
        label: "Get Unapproved Businesses",
        path: "/api/admin/get-unapproved-businesses",
        method: "GET",
      },
      {
        id: "a-pending-biz",
        type: "api_get",
        category: "Directory",
        label: "Get Pending Businesses",
        path: "/api/admin/get-pending-businesses",
        method: "GET",
      },

      {
        id: "a-unapproved-jobs",
        type: "api_get",
        category: "Jobs",
        label: "Get Unapproved Jobs",
        path: "/api/admin/get-unapproved-jobs",
        method: "GET",
      },
      {
        id: "a-unapproved-products",
        type: "api_get",
        category: "Marketplace",
        label: "Get Unapproved Products",
        path: "/api/admin/get-unapproved-products",
        method: "GET",
      },

      {
        id: "a-intern-apps",
        type: "api_get",
        category: "Interns",
        label: "Intern Applications (API)",
        path: "/api/admin/intern-applications",
        method: "GET",
      },

      {
        id: "a-run-cron",
        type: "api_get",
        category: "Directory",
        label: "Run Directory Cron (use with care)",
        path: "/api/admin/run-directory-cron",
        method: "GET",
        notes: "Only run if you know what it does. It may update data in bulk.",
      },

      // =======================
      // APIs (POST / Actions)
      // =======================
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
        label: "Expire/Remove Directory Listing Placement",
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
        id: "x-complete-payout",
        type: "api_post",
        category: "Affiliates",
        label: "Complete Payout",
        path: "/api/admin/complete-payout",
        method: "POST",
        sampleBody: { payoutId: "<mongo_id>" },
      },
    ],
    []
  );

  const [tab, setTab] = useState<ToolItemType | "all">("all");
  const [category, setCategory] = useState<ToolCategory | "all">("all");
  const [query, setQuery] = useState("");

  const [baseline, setBaseline] = useState<Record<string, PingResult>>({});
  const [baselineLoading, setBaselineLoading] = useState(false);

  const [pings, setPings] = useState<Record<string, PingResult>>({});

  const [mounted, setMounted] = useState(false);
  const [clientNow, setClientNow] = useState<string>("");

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
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return ITEMS.filter((i) => {
      if (tab !== "all" && i.type !== tab) return false;
      if (category !== "all" && i.category !== category) return false;
      if (!q) return true;

      const hay = `${i.label} ${i.path} ${i.category} ${i.type} ${
        i.notes || ""
      }`.toLowerCase();
      return hay.includes(q);
    });
  }, [ITEMS, tab, category, query]);

  const baselineOk = useMemo(() => {
    const a = baseline["/api/auth/me"];
    const s = baseline["/api/admin/dashboard-stats"];
    return !!a?.ok && !!s?.ok;
  }, [baseline]);

  const runBaseline = async () => {
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
    if (mounted) setClientNow(new Date().toLocaleString());
  };

  useEffect(() => {
    setMounted(true);
    setClientNow(new Date().toLocaleString());
    runBaseline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        "This is a POST action endpoint. Use the sample curl/JSON instead of pinging it."
      );
      return;
    }
    const r = await ping(item.path);
    setPings((prev) => ({ ...prev, [item.id]: r }));
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen p-6 md:p-10">
      <header className="mb-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gold">Admin Tools</h1>
            <p className="text-gray-400 mt-2">
              One launcher for admin pages + key APIs (plus intern pages). Use
              this before you start work so you don’t waste time.
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
              className="rounded bg-gold text-black px-4 py-2 text-sm font-semibold hover:bg-yellow-400"
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
              : "border-yellow-500/20 bg-gray-800"
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
              <div className="text-xs text-gray-300 mt-1">
                Green means: you’re logged in as admin and the dashboard stats
                endpoint is working.
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

        {/* Quick access (must use Link for internal pages to satisfy eslint) */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <Link
            href="/admin/health"
            className="rounded-xl border border-gray-700 bg-gray-800 p-4 hover:bg-gray-700 transition"
          >
            <div className="text-gold font-semibold">Open Health</div>
            <div className="text-xs text-gray-400 mt-1">/admin/health</div>
          </Link>

          <Link
            href="/admin/dashboard"
            className="rounded-xl border border-gray-700 bg-gray-800 p-4 hover:bg-gray-700 transition"
          >
            <div className="text-gold font-semibold">Open Dashboard</div>
            <div className="text-xs text-gray-400 mt-1">/admin/dashboard</div>
          </Link>

          <Link
            href="/intern/welcome"
            className="rounded-xl border border-gray-700 bg-gray-800 p-4 hover:bg-gray-700 transition"
          >
            <div className="text-gold font-semibold">Intern Welcome</div>
            <div className="text-xs text-gray-400 mt-1">/intern/welcome</div>
          </Link>

          <Link
            href="/intern/tasks"
            className="rounded-xl border border-gray-700 bg-gray-800 p-4 hover:bg-gray-700 transition"
          >
            <div className="text-gold font-semibold">Intern Tasks</div>
            <div className="text-xs text-gray-400 mt-1">/intern/tasks</div>
          </Link>
        </div>

        {/* Filters */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5">
            <label className="block text-xs text-gray-400 mb-1">Search</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by label, route, notes..."
              className="w-full rounded bg-black/40 border border-gray-700 px-4 py-2 text-sm outline-none focus:border-gold/60"
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs text-gray-400 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full rounded bg-black/40 border border-gray-700 px-4 py-2 text-sm outline-none focus:border-gold/60"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "All categories" : c}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs text-gray-400 mb-1">Type</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTab("all")}
                className={cx(
                  "rounded-full px-4 py-2 text-xs border transition",
                  tab === "all"
                    ? "bg-gold text-black border-gold"
                    : "bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700"
                )}
              >
                All ({counts.all})
              </button>
              <button
                onClick={() => setTab("page")}
                className={cx(
                  "rounded-full px-4 py-2 text-xs border transition",
                  tab === "page"
                    ? "bg-gold text-black border-gold"
                    : "bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700"
                )}
              >
                Pages ({counts.page})
              </button>
              <button
                onClick={() => setTab("api_get")}
                className={cx(
                  "rounded-full px-4 py-2 text-xs border transition",
                  tab === "api_get"
                    ? "bg-gold text-black border-gold"
                    : "bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700"
                )}
              >
                APIs GET ({counts.api_get})
              </button>
              <button
                onClick={() => setTab("api_post")}
                className={cx(
                  "rounded-full px-4 py-2 text-xs border transition",
                  tab === "api_post"
                    ? "bg-gold text-black border-gold"
                    : "bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700"
                )}
              >
                Actions POST ({counts.api_post})
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Summary */}
      <section className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <StatPill
            label="Visible items (filtered)"
            value={String(filtered.length)}
          />
          <StatPill label="Pages in repo" value={String(counts.page)} />
          <StatPill label="GET APIs in repo" value={String(counts.api_get)} />
          <StatPill
            label="POST Actions in repo"
            value={String(counts.api_post)}
          />
        </div>
      </section>

      {/* Items */}
      <section className="bg-gray-800 rounded p-4 border border-gray-700">
        <div className="mb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h2 className="text-lg font-bold text-gold">Launcher List</h2>
          <div className="text-xs text-gray-400">
            Tip: Use “Ping” to confirm 200/401 quickly. Don’t POST from here —
            use the admin UI buttons.
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gold border-b border-gray-700">
                <th className="py-2 px-3 text-left">Label</th>
                <th className="py-2 px-3 text-left">Type</th>
                <th className="py-2 px-3 text-left">Category</th>
                <th className="py-2 px-3 text-left">Route</th>
                <th className="py-2 px-3 text-left">Status</th>
                <th className="py-2 px-3 text-left">Actions</th>
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

                const isPost = item.type === "api_post";
                const internal = isInternalNextRoute(item.path);

                return (
                  <tr
                    key={item.id}
                    className="border-b border-gray-700/60 align-top"
                  >
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">{item.label}</div>
                      {item.notes ? (
                        <div className="text-xs text-gray-400 mt-1">
                          {item.notes}
                        </div>
                      ) : null}
                    </td>

                    <td className="py-3 px-3">
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

                    <td className="py-3 px-3">
                      <Badge tone="neutral">{item.category}</Badge>
                    </td>

                    <td className="py-3 px-3">
                      <code className="text-xs text-gray-200">{item.path}</code>
                      {isPost && item.sampleBody ? (
                        <div className="mt-2 rounded border border-gray-700 bg-black/30 p-2">
                          <div className="text-xs text-gray-400 mb-1">
                            Sample body:
                          </div>
                          <pre className="text-xs text-gray-200 overflow-auto">
                            {JSON.stringify(item.sampleBody, null, 2)}
                          </pre>
                        </div>
                      ) : null}
                    </td>

                    <td className="py-3 px-3">
                      <Badge tone={statusTone as any}>
                        {isPost ? "POST only" : pr ? pr.status ?? "ERR" : "—"}
                      </Badge>
                      {pr?.error ? (
                        <div className="text-xs text-red-200 mt-1">{pr.error}</div>
                      ) : null}
                      {pr?.at ? (
                        <div className="text-[11px] text-gray-500 mt-1">
                          {new Date(pr.at).toLocaleTimeString()}
                        </div>
                      ) : null}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-2">
                        {/* OPEN */}
                        {!isPost ? (
                          internal ? (
                            <Link
                              href={item.path}
                              className="rounded bg-gray-900 border border-gray-700 px-3 py-1 text-xs hover:bg-gray-700"
                            >
                              Open
                            </Link>
                          ) : (
                            <a
                              href={item.path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded bg-gray-900 border border-gray-700 px-3 py-1 text-xs hover:bg-gray-700"
                            >
                              Open
                            </a>
                          )
                        ) : (
                          <button
                            onClick={() => copy(item.path)}
                            className="rounded bg-gray-900 border border-gray-700 px-3 py-1 text-xs hover:bg-gray-700"
                          >
                            Copy URL
                          </button>
                        )}

                        {/* COPY */}
                        <button
                          onClick={() => copy(item.path)}
                          className="rounded bg-gray-900 border border-gray-700 px-3 py-1 text-xs hover:bg-gray-700"
                        >
                          Copy
                        </button>

                        {/* PING */}
                        <button
                          onClick={() => pingItem(item)}
                          className="rounded bg-gray-900 border border-gray-700 px-3 py-1 text-xs hover:bg-gray-700"
                        >
                          Ping
                        </button>

                        {/* CURL */}
                        {isPost ? (
                          <button
                            onClick={() => {
                              const curl = `curl -X POST "http://localhost:3000${item.path}" -H "Content-Type: application/json" -d '${JSON.stringify(
                                item.sampleBody || {},
                                null,
                                0
                              )}'`;
                              copy(curl);
                              alert("Copied sample curl to clipboard.");
                            }}
                            className="rounded bg-gray-900 border border-gray-700 px-3 py-1 text-xs hover:bg-gray-700"
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
                    No matches. Try clearing search/filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="mt-10 text-center text-xs text-gray-500">
        Tip: Bookmark <span className="text-gold">/admin/tools</span> and start
        every session with <span className="text-gold">Run Baseline Check</span>.
      </footer>
    </div>
  );
}
