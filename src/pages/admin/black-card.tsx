import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

type CardItem = {
  cardId: string;
  userId: string | null;
  email: string | null;
  memberId: string | null;
  cardSerial: string | null;
  cardType: string;
  cardStatus: string;
  publicVerificationId: string | null;
  physicalRequestStatus: string | null;
  createdAt?: string | null;
  updatedAt: string | null;
};

type PhysicalRequestItem = {
  requestId: string;
  memberId: string | null;
  userId: string | null;
  email?: string | null;
  cardId?: string | null;
  cardSerial?: string | null;
  cardType: string | null;
  status: string;
  nameToPrint: string;
  vendorRef?: string | null;
  trackingNumber?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type RedemptionItem = {
  id: string;
  userId: string;
  rewardType: string;
  pointsCost: number;
  status: string;
  createdAt: string | null;
};

function fmtDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

export default function AdminBlackCardPage() {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [physical, setPhysical] = useState<PhysicalRequestItem[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [cardStatus, setCardStatus] = useState("");
  const [requestStatus, setRequestStatus] = useState("");

  const [userId, setUserId] = useState("");
  const [pointsDelta, setPointsDelta] = useState("");
  const [reason, setReason] = useState("");
  const [adjustMsg, setAdjustMsg] = useState("");

  const cardRows = useMemo(() => cards.slice(0, 200), [cards]);
  const requestRows = useMemo(() => physical.slice(0, 200), [physical]);

  async function loadData() {
    setError("");
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (cardStatus) params.set("cardStatus", cardStatus);
    if (requestStatus) params.set("requestStatus", requestStatus);

    const [cardsRes, physicalRes, redRes] = await Promise.all([
      fetch(`/api/admin/black-card/cards?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      }),
      fetch("/api/admin/black-card/physical-requests", {
        credentials: "include",
        cache: "no-store",
      }),
      fetch("/api/admin/black-card/redemptions", {
        credentials: "include",
        cache: "no-store",
      }),
    ]);

    const cardsJson = await cardsRes.json().catch(() => ({}));
    const physicalJson = await physicalRes.json().catch(() => ({}));
    const redJson = await redRes.json().catch(() => ({}));

    if (!cardsRes.ok) {
      setError(cardsJson?.error || "Unable to load Black Card data.");
      return;
    }

    setCards(Array.isArray(cardsJson.items) ? cardsJson.items : []);
    setPhysical(Array.isArray(physicalJson.items) ? physicalJson.items : []);
    setRedemptions(Array.isArray(redJson.items) ? redJson.items : []);
  }

  useEffect(() => {
    (async () => {
      try {
        await loadData();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cardAction(cardId: string, action: "suspend" | "revoke" | "replace") {
    const res = await fetch("/api/admin/black-card/cards", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, action }),
    });
    if (res.ok) await loadData();
  }

  async function requestAction(
    requestId: string,
    action: "approve" | "sent_to_vendor" | "shipped" | "delivered",
  ) {
    const vendorRef =
      action === "sent_to_vendor"
        ? window.prompt("Vendor reference (optional):") || ""
        : "";
    const trackingNumber =
      action === "shipped"
        ? window.prompt("Tracking number (optional):") || ""
        : "";

    const res = await fetch("/api/admin/black-card/physical-requests", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action, vendorRef, trackingNumber }),
    });

    if (res.ok) await loadData();
  }

  async function setRedemptionStatus(
    redemptionId: string,
    status: "approved" | "rejected" | "fulfilled",
  ) {
    const res = await fetch("/api/admin/black-card/redemptions", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ redemptionId, status }),
    });
    if (res.ok) await loadData();
  }

  async function submitAdjust(e: FormEvent) {
    e.preventDefault();
    setAdjustMsg("");
    const res = await fetch("/api/admin/black-card/rewards-adjust", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        pointsDelta: Number(pointsDelta),
        reason,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setAdjustMsg(json?.error || "Adjustment failed");
      return;
    }
    setAdjustMsg(`Adjusted successfully. New balance: ${json.balance}`);
    setUserId("");
    setPointsDelta("");
    setReason("");
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-yellow-200">
            Black Card Management
          </h1>
          <Link
            href="/admin/dashboard"
            className="rounded border border-white/20 px-3 py-1.5 text-sm"
          >
            Back to Admin Dashboard
          </Link>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/85">
          <h2 className="text-lg font-bold text-yellow-200">How this works</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>BWE issues and controls the digital Black Card identity and verification.</li>
            <li>Physical cards are vendor-produced fulfillment artifacts.</li>
            <li>QR/member verification is controlled by BWE and must pass live verification.</li>
            <li>Copied card images are not valid unless live verification passes.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-bold text-yellow-200">Search and filters</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by member ID, email, user ID, or card serial"
              className="rounded bg-black/40 px-3 py-2 text-sm"
            />
            <input
              value={cardStatus}
              onChange={(e) => setCardStatus(e.target.value)}
              placeholder="Card status"
              className="rounded bg-black/40 px-3 py-2 text-sm"
            />
            <input
              value={requestStatus}
              onChange={(e) => setRequestStatus(e.target.value)}
              placeholder="Physical request status"
              className="rounded bg-black/40 px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={() => loadData()}
                className="rounded border border-yellow-500/30 px-3 py-2 text-sm text-yellow-200"
              >
                Apply
              </button>
              <button
                onClick={() => {
                  setQuery("");
                  setCardStatus("");
                  setRequestStatus("");
                  setTimeout(() => loadData(), 0);
                }}
                className="rounded border border-white/20 px-3 py-2 text-sm text-white/85"
              >
                Reset
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-bold text-yellow-200">Issued cards</h2>
          {loading ? (
            <p className="mt-3 text-sm text-white/70">Loading...</p>
          ) : error ? (
            <p className="mt-3 text-sm text-red-300">{error}</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="text-white/70">
                  <tr>
                    <th className="pr-4 py-2">Member ID</th>
                    <th className="pr-4 py-2">Card Type</th>
                    <th className="pr-4 py-2">Card Status</th>
                    <th className="pr-4 py-2">Linked User / Email</th>
                    <th className="pr-4 py-2">Verification</th>
                    <th className="pr-4 py-2">Issued</th>
                    <th className="pr-4 py-2">Updated</th>
                    <th className="pr-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cardRows.map((c) => {
                    const verifyLink = c.publicVerificationId
                      ? `/black-card/verify/${c.publicVerificationId}`
                      : null;
                    return (
                      <tr key={c.cardId} className="border-t border-white/10 align-top">
                        <td className="pr-4 py-2">{c.memberId || "—"}</td>
                        <td className="pr-4 py-2">{c.cardType || "—"}</td>
                        <td className="pr-4 py-2">{c.cardStatus || "—"}</td>
                        <td className="pr-4 py-2 break-all">
                          <div>{c.userId || "—"}</div>
                          <div className="text-white/60">{c.email || "—"}</div>
                        </td>
                        <td className="pr-4 py-2 break-all">
                          <div>{c.publicVerificationId || "—"}</div>
                          {verifyLink ? (
                            <Link className="text-yellow-300 underline" href={verifyLink}>
                              Open verification
                            </Link>
                          ) : null}
                        </td>
                        <td className="pr-4 py-2">{fmtDate(c.createdAt)}</td>
                        <td className="pr-4 py-2">{fmtDate(c.updatedAt)}</td>
                        <td className="pr-4 py-2">
                          <div className="flex flex-wrap gap-1">
                            <button onClick={() => cardAction(c.cardId, "suspend")} className="rounded border border-yellow-500/30 px-2 py-1">Suspend</button>
                            <button onClick={() => cardAction(c.cardId, "revoke")} className="rounded border border-red-500/30 px-2 py-1">Revoke</button>
                            <button onClick={() => cardAction(c.cardId, "replace")} className="rounded border border-blue-500/30 px-2 py-1">Replace</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {cardRows.length === 0 ? (
                <p className="text-sm text-white/70">No issued cards found.</p>
              ) : null}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-bold text-yellow-200">Physical card request tracking</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="text-white/70">
                <tr>
                  <th className="pr-4 py-2">Request</th>
                  <th className="pr-4 py-2">Name to Print</th>
                  <th className="pr-4 py-2">Status</th>
                  <th className="pr-4 py-2">Linked Member/Card</th>
                  <th className="pr-4 py-2">Vendor / Tracking</th>
                  <th className="pr-4 py-2">Updated</th>
                  <th className="pr-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requestRows.map((r) => (
                  <tr key={r.requestId} className="border-t border-white/10 align-top">
                    <td className="pr-4 py-2 break-all">
                      <div>{r.requestId}</div>
                      <div className="text-white/60">{r.email || r.userId || "—"}</div>
                    </td>
                    <td className="pr-4 py-2">{r.nameToPrint || "—"}</td>
                    <td className="pr-4 py-2">{r.status || "—"}</td>
                    <td className="pr-4 py-2 break-all">
                      <div>Member: {r.memberId || "—"}</div>
                      <div className="text-white/60">Card: {r.cardId || r.cardSerial || "—"}</div>
                    </td>
                    <td className="pr-4 py-2 break-all">
                      <div>Vendor ref: {r.vendorRef || "—"}</div>
                      <div>Tracking: {r.trackingNumber || "—"}</div>
                    </td>
                    <td className="pr-4 py-2">{fmtDate(r.updatedAt)}</td>
                    <td className="pr-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        <button onClick={() => requestAction(r.requestId, "approve")} className="rounded border border-green-500/30 px-2 py-1">Approve</button>
                        <button onClick={() => requestAction(r.requestId, "sent_to_vendor")} className="rounded border border-yellow-500/30 px-2 py-1">Mark sent to vendor</button>
                        <button onClick={() => requestAction(r.requestId, "shipped")} className="rounded border border-blue-500/30 px-2 py-1">Mark shipped</button>
                        <button onClick={() => requestAction(r.requestId, "delivered")} className="rounded border border-purple-500/30 px-2 py-1">Mark delivered</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {requestRows.length === 0 ? (
              <p className="text-sm text-white/70">No physical requests found.</p>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-bold text-yellow-200">Redemption queue and rewards adjustment</h2>
          <div className="mt-3 space-y-2 text-sm">
            {redemptions.slice(0, 20).map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-black/30 p-3">
                <div className="font-semibold">{item.rewardType} • {item.pointsCost} pts</div>
                <div className="text-white/70">user: {item.userId} • status: {item.status} • {fmtDate(item.createdAt)}</div>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => setRedemptionStatus(item.id, "approved")} className="rounded border border-yellow-500/30 px-2 py-1 text-xs text-yellow-200">Approve</button>
                  <button onClick={() => setRedemptionStatus(item.id, "rejected")} className="rounded border border-red-500/30 px-2 py-1 text-xs text-red-200">Reject</button>
                  <button onClick={() => setRedemptionStatus(item.id, "fulfilled")} className="rounded border border-green-500/30 px-2 py-1 text-xs text-green-200">Fulfilled</button>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={submitAdjust} className="mt-5 grid gap-3 sm:grid-cols-4">
            <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="User ID" className="rounded bg-black/40 px-3 py-2 text-sm" />
            <input value={pointsDelta} onChange={(e) => setPointsDelta(e.target.value)} placeholder="Points Delta" className="rounded bg-black/40 px-3 py-2 text-sm" />
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" className="rounded bg-black/40 px-3 py-2 text-sm" />
            <button className="rounded bg-yellow-500 px-3 py-2 text-sm font-semibold text-black">Submit points adjustment</button>
          </form>
          {adjustMsg ? <p className="mt-2 text-sm text-yellow-200">{adjustMsg}</p> : null}
        </section>
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
        destination: "/login?redirect=/admin/black-card",
        permanent: false,
      },
    };
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as {
      accountType?: string;
      role?: string;
      isAdmin?: boolean;
      roles?: string[];
    };

    const isAdmin =
      payload.isAdmin === true ||
      payload.accountType === "admin" ||
      payload.role === "admin" ||
      (Array.isArray(payload.roles) && payload.roles.includes("admin"));

    if (!isAdmin) {
      return {
        redirect: {
          destination: "/login?redirect=/admin/black-card",
          permanent: false,
        },
      };
    }
  } catch {
    return {
      redirect: {
        destination: "/login?redirect=/admin/black-card",
        permanent: false,
      },
    };
  }

  return { props: {} };
};
