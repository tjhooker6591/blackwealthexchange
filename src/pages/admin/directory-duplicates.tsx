import React, { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

type DuplicateRow = {
  id: string;
  businessName: string;
  alias?: string | null;
  email?: string | null;
  state?: string | null;
  status: string;
  duplicateOf?: string | null;
  keeper?: {
    id?: string | null;
    alias?: string | null;
    businessName?: string | null;
  } | null;
  createdAtIso?: string | null;
  updatedAtIso?: string | null;
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

function fmtDate(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

export default function DirectoryDuplicatesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<DuplicateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (search = "") => {
    const params = new URLSearchParams({ limit: "200" });
    if (search.trim()) params.set("q", search.trim());

    const res = await fetch(`/api/admin/directory-duplicates?${params.toString()}`, {
      cache: "no-store",
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Failed to load duplicate queue");

    setRows(Array.isArray(data?.duplicates) ? data.duplicates : []);
  }, []);

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      try {
        const meRes = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        if (!meRes.ok) {
          router.replace("/login?redirect=/admin/directory-duplicates");
          return;
        }

        const meData: MeResponse = await meRes.json().catch(() => ({}));
        if (!userIsAdmin(meData.user)) {
          router.replace("/");
          return;
        }

        await load();
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load duplicate queue");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    boot();
    return () => {
      mounted = false;
    };
  }, [load, router]);

  const resolve = async (businessId: string, action: "archive_duplicate" | "approve_with_unique_alias") => {
    try {
      setBusyId(businessId);
      setError("");

      const res = await fetch("/api/admin/directory-duplicates/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ businessId, action }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to resolve duplicate");

      setRows((prev) => prev.filter((r) => r.id !== businessId));
    } catch (e: any) {
      setError(e?.message || "Failed to resolve duplicate");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <Head>
        <title>Admin | Directory Duplicates</title>
      </Head>

      <main className="min-h-screen bg-black p-6 text-white md:p-10">
        <div className="mx-auto max-w-7xl">
          <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gold">Directory Duplicates Queue</h1>
              <p className="mt-1 text-sm text-zinc-400">
                Resolve duplicate_pending_review records safely without deleting data.
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                href="/admin/business-approvals"
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
              >
                Business Approvals
              </Link>
              <Link
                href="/admin/dashboard"
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
              >
                Admin Dashboard
              </Link>
            </div>
          </header>

          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name / alias / email / duplicateOf"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-gold/60"
            />
            <button
              onClick={() => load(q)}
              className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold hover:bg-gold/20"
            >
              Search
            </button>
          </div>

          {error ? (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 text-zinc-300">
              Loading duplicate queue…
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 text-zinc-300">
              No unresolved duplicates found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-400">
                  <tr>
                    <th className="p-3">Business</th>
                    <th className="p-3">Alias</th>
                    <th className="p-3">Duplicate Of</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Updated</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const disabled = busyId === r.id;
                    return (
                      <tr key={r.id} className="border-b border-zinc-800 last:border-b-0">
                        <td className="p-3">
                          <div className="font-semibold text-white">{r.businessName}</div>
                          <div className="text-xs text-zinc-400">{r.email || r.state || "—"}</div>
                        </td>
                        <td className="p-3 text-zinc-200">{r.alias || "—"}</td>
                        <td className="p-3">
                          {r.keeper ? (
                            <div>
                              <div className="font-medium text-zinc-100">{r.keeper.businessName || "Keeper"}</div>
                              <div className="text-xs text-zinc-400">{r.keeper.alias || r.duplicateOf || "—"}</div>
                            </div>
                          ) : (
                            <span className="text-zinc-400">{r.duplicateOf || "—"}</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="rounded border border-yellow-500/30 bg-yellow-500/15 px-2 py-1 text-xs text-yellow-200">
                            {r.status}
                          </span>
                        </td>
                        <td className="p-3 text-zinc-400">{fmtDate(r.updatedAtIso || r.createdAtIso)}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              disabled={disabled}
                              onClick={() => resolve(r.id, "archive_duplicate")}
                              className="rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
                            >
                              Archive duplicate
                            </button>
                            <button
                              disabled={disabled}
                              onClick={() => resolve(r.id, "approve_with_unique_alias")}
                              className="rounded border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-50"
                            >
                              Not duplicate → approve w/ unique alias
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
