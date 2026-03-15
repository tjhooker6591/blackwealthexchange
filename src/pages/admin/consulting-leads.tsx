import { useEffect, useState } from "react";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

type Lead = {
  _id: string;
  collection: "consulting_interest" | "consulting_intake";
  name: string;
  businessName: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "flagged"
    | "spam"
    | "deleted"
    | string;
  lifecycleStage?:
    | "new"
    | "triaged"
    | "approved"
    | "discovery_scheduled"
    | "proposal_sent"
    | "in_delivery"
    | "closed_won"
    | "closed_lost"
    | string;
  nextAction?: string;
  owner?: string;
  followUpAt?: string | null;
  source?: string;
  intakeType?: string;
  createdAt?: string | null;
  adminNote?: string;
  ip?: string | null;
  userAgent?: string | null;
};

export default function ConsultingLeadsAdminPage() {
  const [rows, setRows] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");

  async function loadRows() {
    const res = await fetch("/api/admin/consulting-interests", {
      credentials: "include",
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Failed to load leads");
    setRows(Array.isArray(data?.interests) ? data.interests : []);
  }

  useEffect(() => {
    (async () => {
      try {
        await loadRows();
      } catch (e: any) {
        setError(e?.message || "Failed to load leads");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function updateLead(
    lead: Lead,
    patch: {
      status?:
        | "pending"
        | "approved"
        | "rejected"
        | "flagged"
        | "spam"
        | "deleted";
      lifecycleStage?: string;
      nextAction?: string;
      owner?: string;
      followUpAt?: string | null;
    },
  ) {
    setSavingId(lead._id);
    try {
      const res = await fetch("/api/admin/consulting-interests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: lead._id,
          collection: lead.collection,
          status: patch.status ?? lead.status,
          stage: patch.lifecycleStage ?? lead.lifecycleStage ?? lead.status,
          nextAction: patch.nextAction ?? lead.nextAction ?? "",
          owner: patch.owner ?? lead.owner ?? "",
          followUpAt: patch.followUpAt ?? lead.followUpAt ?? null,
          adminNote: lead.adminNote || "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to update status");
      await loadRows();
    } catch (e: any) {
      setError(e?.message || "Failed to update status");
    } finally {
      setSavingId("");
    }
  }

  async function deleteLead(lead: Lead) {
    if (!confirm("Delete this lead from active review?")) return;
    setSavingId(lead._id);
    try {
      const res = await fetch("/api/admin/consulting-interests", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: lead._id,
          collection: lead.collection,
          reason: "Removed by admin moderation",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to delete lead");
      await loadRows();
    } catch (e: any) {
      setError(e?.message || "Failed to delete lead");
    } finally {
      setSavingId("");
    }
  }

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-3xl font-black text-[#D4AF37]">
            Consulting Leads
          </h1>
          <Link
            href="/admin/dashboard"
            className="text-sm text-[#D4AF37] hover:underline"
          >
            Back to Admin Dashboard
          </Link>
        </div>

        {loading ? <p className="text-white/70">Loading…</p> : null}
        {error ? <p className="text-red-400">{error}</p> : null}

        {!loading && !error ? (
          <div className="overflow-auto rounded-xl border border-white/10 bg-white/5">
            <table className="w-full text-sm">
              <thead className="text-left text-white/60">
                <tr>
                  <th className="p-2">Date</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Business</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Service</th>
                  <th className="p-2">Source</th>
                  <th className="p-2">Status / Stage</th>
                  <th className="p-2">Next Action</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td className="p-2 text-white/60" colSpan={9}>
                      No consulting leads yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr
                      key={r._id}
                      className="border-t border-white/10 align-top"
                    >
                      <td className="p-2">
                        {r.createdAt
                          ? new Date(r.createdAt).toLocaleString()
                          : "-"}
                      </td>
                      <td className="p-2">{r.name || "-"}</td>
                      <td className="p-2">{r.businessName || "-"}</td>
                      <td className="p-2">{r.email || "-"}</td>
                      <td className="p-2">{r.service || "-"}</td>
                      <td className="p-2 text-xs">
                        <div>{r.source || r.intakeType || "-"}</div>
                        <div className="text-white/50">IP: {r.ip || "-"}</div>
                        <div
                          className="text-white/50 max-w-[220px] truncate"
                          title={r.userAgent || ""}
                        >
                          UA: {r.userAgent || "-"}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="text-xs text-white/80">
                          {r.status || "new"}
                        </div>
                        <div className="mt-1 text-[11px] text-white/55">
                          stage: {r.lifecycleStage || "new"}
                        </div>
                      </td>
                      <td className="p-2 text-xs text-white/70 max-w-[260px]">
                        {r.nextAction || "No next action set"}
                        {r.followUpAt ? (
                          <div className="mt-1 text-[11px] text-white/50">
                            follow-up: {new Date(r.followUpAt).toLocaleString()}
                          </div>
                        ) : null}
                      </td>
                      <td className="p-2 space-y-2">
                        <select
                          className="rounded border border-white/20 bg-black px-2 py-1 text-xs"
                          value={r.status || "pending"}
                          disabled={savingId === r._id}
                          onChange={(e) =>
                            updateLead(r, {
                              status: e.target.value as
                                | "pending"
                                | "approved"
                                | "rejected"
                                | "flagged",
                            })
                          }
                        >
                          <option value="pending">pending</option>
                          <option value="approved">approved</option>
                          <option value="flagged">flagged</option>
                          <option value="spam">spam</option>
                          <option value="rejected">rejected</option>
                          <option value="deleted">deleted</option>
                        </select>

                        <div className="flex flex-wrap gap-1">
                          <button
                            className="rounded bg-emerald-600/80 px-2 py-1 text-[11px] font-semibold"
                            disabled={savingId === r._id}
                            onClick={() =>
                              updateLead(r, {
                                status: "approved",
                                lifecycleStage: "discovery_scheduled",
                                nextAction: "Schedule discovery call",
                                followUpAt: new Date(
                                  Date.now() + 48 * 60 * 60 * 1000,
                                ).toISOString(),
                              })
                            }
                          >
                            Approve + discovery
                          </button>
                          <button
                            className="rounded bg-sky-600/80 px-2 py-1 text-[11px] font-semibold"
                            disabled={savingId === r._id}
                            onClick={() =>
                              updateLead(r, {
                                lifecycleStage: "proposal_sent",
                                nextAction: "Send proposal + pricing",
                              })
                            }
                          >
                            Mark proposal sent
                          </button>
                          <button
                            className="rounded bg-purple-600/80 px-2 py-1 text-[11px] font-semibold"
                            disabled={savingId === r._id}
                            onClick={() =>
                              updateLead(r, {
                                lifecycleStage: "in_delivery",
                                nextAction: "Kickoff delivery plan",
                              })
                            }
                          >
                            Move to delivery
                          </button>
                          <button
                            className="rounded bg-red-700/80 px-2 py-1 text-[11px] font-semibold"
                            disabled={savingId === r._id}
                            onClick={() => deleteLead(r)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.session_token;

  if (!token) {
    return {
      redirect: {
        destination: "/login?redirect=/admin/consulting-leads",
        permanent: false,
      },
    };
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as {
      accountType?: string;
      isAdmin?: boolean;
    };

    if (!(payload.isAdmin === true || payload.accountType === "admin")) {
      return {
        redirect: {
          destination: "/login?redirect=/admin/consulting-leads",
          permanent: false,
        },
      };
    }
  } catch {
    return {
      redirect: {
        destination: "/login?redirect=/admin/consulting-leads",
        permanent: false,
      },
    };
  }

  return { props: {} };
};
