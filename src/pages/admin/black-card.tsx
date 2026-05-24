import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getJwtSecret, getMongoDbName } from "@/lib/env";

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

type DigitalRequestItem = {
  requestId: string;
  userId: string | null;
  email: string | null;
  fullName: string | null;
  accountStatus: string;
  currentPlan: string;
  status: string;
  memberId?: string | null;
  publicVerificationId?: string | null;
  approvedAt?: string | null;
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

type LedgerRow = {
  id: string;
  user: string;
  points: number;
  reason: string;
  timestamp: string | null;
  status: string;
};

type MembershipEmailEvent = {
  email: string | null;
  userId: string | null;
  plan: string | null;
  cardTier: string | null;
  type: string | null;
  recipient: string | null;
  sent: boolean;
  error: string | null;
  stripeSessionId: string | null;
  paymentIntentId: string | null;
  at: string | null;
};

type LifecycleItem = {
  _id: string;
  email?: string | null;
  userId?: string | null;
  previousPlan?: string;
  currentPlan?: string;
  previousBlackCardTier?: string;
  blackCardTier?: string;
  membershipStatus?: string;
  lastPaymentSessionId?: string | null;
  lastPaymentIntentId?: string | null;
  sourceStripeSessionId?: string | null;
  sourcePaymentIntentId?: string | null;
  lastMembershipEventType?: string;
  membershipReviewStatus?: string;
  membershipReviewNotes?: any[];
  reviewedBy?: string;
  reviewedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  membershipEmailEvents?: any[];
};

type PageProps = {
  initialLedger: LedgerRow[];
  initialTotalPointsIssued: number;
};

function fmtDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toISOString().replace("T", " ").replace(".000Z", " UTC");
}

function toTitleLabel(value: string) {
  return (value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function maskUserId(userId?: string | null) {
  const v = String(userId || "");
  if (!v) return "—";
  if (v.length <= 8) return v;
  return `${v.slice(0, 4)}…${v.slice(-4)}`;
}

function isTestRecord(...values: Array<string | null | undefined>) {
  return values.some((v) =>
    String(v || "")
      .toUpperCase()
      .includes("TEST_BC_LIFECYCLE"),
  );
}

export default function AdminBlackCardPage({
  initialLedger,
  initialTotalPointsIssued,
}: PageProps) {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [physical, setPhysical] = useState<PhysicalRequestItem[]>([]);
  const [digitalRequests, setDigitalRequests] = useState<DigitalRequestItem[]>(
    [],
  );
  const [actionMessage, setActionMessage] = useState("");
  const [redemptions, setRedemptions] = useState<RedemptionItem[]>([]);
  const [membershipEmailEvents, setMembershipEmailEvents] = useState<
    MembershipEmailEvent[]
  >([]);
  const [lifecycleItems, setLifecycleItems] = useState<LifecycleItem[]>([]);
  const [lifecycleFilter, setLifecycleFilter] = useState("all");
  const [reviewNote, setReviewNote] = useState("");
  const [ledger] = useState<LedgerRow[]>(initialLedger || []);
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

  const pendingRedemptions = useMemo(
    () => redemptions.filter((r) => r.status === "pending").length,
    [redemptions],
  );
  const activeCards = useMemo(
    () => cardRows.filter((c) => c.cardStatus === "active").length,
    [cardRows],
  );
  const suspendedCards = useMemo(
    () => cardRows.filter((c) => c.cardStatus === "suspended").length,
    [cardRows],
  );

  async function loadData() {
    setError("");
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (cardStatus) params.set("cardStatus", cardStatus);
    if (requestStatus) params.set("requestStatus", requestStatus);

    params.set("lifecycleFilter", lifecycleFilter);
    const [cardsRes, physicalRes, redRes, digitalRes] = await Promise.all([
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
      fetch("/api/admin/black-card/digital-requests", {
        credentials: "include",
        cache: "no-store",
      }),
    ]);

    const cardsJson = await cardsRes.json().catch(() => ({}));
    const physicalJson = await physicalRes.json().catch(() => ({}));
    const redJson = await redRes.json().catch(() => ({}));
    const digitalJson = await digitalRes.json().catch(() => ({}));

    if (!cardsRes.ok) {
      setError(cardsJson?.error || "Unable to load Black Card data.");
      return;
    }

    setCards(Array.isArray(cardsJson.items) ? cardsJson.items : []);
    setMembershipEmailEvents(
      Array.isArray(cardsJson.membershipEmailEvents)
        ? cardsJson.membershipEmailEvents
        : [],
    );
    setLifecycleItems(
      Array.isArray(cardsJson.lifecycleItems) ? cardsJson.lifecycleItems : [],
    );
    setPhysical(Array.isArray(physicalJson.items) ? physicalJson.items : []);
    setRedemptions(Array.isArray(redJson.items) ? redJson.items : []);
    setDigitalRequests(
      Array.isArray(digitalJson.items)
        ? digitalJson.items.map((d: any) => ({
            requestId: String(d._id),
            userId: d.userId || null,
            email: d.email || null,
            fullName: d.fullName || null,
            accountStatus: String(
              d?.membershipStatusAtRequest?.accountStatus || "unknown",
            ),
            currentPlan: String(
              d?.membershipStatusAtRequest?.currentPlan || "unknown",
            ),
            status: String(d?.status || "pending"),
            memberId: d?.memberId || null,
            publicVerificationId: d?.publicVerificationId || null,
            approvedAt: d?.approvedAt || null,
            updatedAt: d?.updatedAt || d?.createdAt || null,
          }))
        : [],
    );
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
  }, [lifecycleFilter]);

  async function cardAction(
    cardId: string,
    action: "activate" | "suspend" | "revoke" | "replace",
  ) {
    setActionMessage("");
    const res = await fetch("/api/admin/black-card/cards", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, action }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setActionMessage(json?.error || "Card action failed");
      return;
    }
    setActionMessage(`Card ${action}d successfully`);
    await loadData();
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

  async function setDigitalRequestStatus(
    requestId: string,
    action: "approve" | "reject",
  ) {
    setActionMessage("");
    const res = await fetch("/api/admin/black-card/digital-requests", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const raw = String(json?.error || "Digital request action failed");
      if (
        res.status === 409 &&
        raw
          .toLowerCase()
          .includes("invalid transition from approved to approved")
      ) {
        setActionMessage(
          "This request is already approved and the digital card has already been issued.",
        );
        return;
      }
      setActionMessage(raw);
      return;
    }
    setActionMessage(`Digital request ${action}d successfully`);
    await loadData();
  }

  async function reviewMembership(membershipId: string, reviewStatus: string) {
    const res = await fetch("/api/admin/black-card/cards", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "review_membership",
        membershipId,
        reviewStatus,
        note: reviewNote,
      }),
    });
    if (res.ok) {
      setReviewNote("");
      await loadData();
    }
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

        <section className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm sm:grid-cols-5">
          <div className="rounded border border-white/10 bg-black/30 p-3">
            <div className="text-white/60">Total cards issued</div>
            <div className="text-xl font-bold text-yellow-200">
              {cardRows.length}
            </div>
          </div>
          <div className="rounded border border-white/10 bg-black/30 p-3">
            <div className="text-white/60">Active cards</div>
            <div className="text-xl font-bold text-green-300">
              {activeCards}
            </div>
          </div>
          <div className="rounded border border-white/10 bg-black/30 p-3">
            <div className="text-white/60">Suspended cards</div>
            <div className="text-xl font-bold text-red-300">
              {suspendedCards}
            </div>
          </div>
          <div className="rounded border border-white/10 bg-black/30 p-3">
            <div className="text-white/60">Pending redemptions</div>
            <div className="text-xl font-bold text-yellow-300">
              {pendingRedemptions}
            </div>
          </div>
          <div className="rounded border border-white/10 bg-black/30 p-3">
            <div className="text-white/60">Total points issued</div>
            <div className="text-xl font-bold text-blue-300">
              {initialTotalPointsIssued}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/85">
          <h2 className="text-lg font-bold text-yellow-200">How this works</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              BWE issues and controls the digital Black Card identity and
              verification.
            </li>
            <li>Physical cards are vendor-produced fulfillment artifacts.</li>
            <li>
              QR/member verification is controlled by BWE and must pass live
              verification.
            </li>
            <li>
              Copied card images are not valid unless live verification passes.
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-bold text-yellow-200">
            Search and filters
          </h2>
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
          <h2 className="text-lg font-bold text-yellow-200">
            A. Membership Lifecycle / Plan Changes
          </h2>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {[
              ["all", "All"],
              ["membership_activated", "New Activations"],
              ["membership_upgraded", "Upgrades"],
              ["pending_review", "Pending Review"],
              ["needs_attention", "Needs Attention"],
              ["confirmed", "Confirmed"],
              ["failed_email", "Failed Email"],
            ].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setLifecycleFilter(v)}
                className="rounded border border-white/20 px-2 py-1"
              >
                {l}
              </button>
            ))}
          </div>
          <textarea
            className="mt-2 w-full rounded bg-black/40 px-3 py-2 text-xs"
            placeholder="Admin review note"
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
          />
          <div className="mt-3 space-y-2 text-xs">
            {lifecycleItems
              .filter((x: any) =>
                lifecycleFilter === "all" ||
                lifecycleFilter === "pending_review" ||
                lifecycleFilter === "needs_attention" ||
                lifecycleFilter === "confirmed" ||
                lifecycleFilter === "failed_email"
                  ? true
                  : String(x.lastMembershipEventType || "") === lifecycleFilter,
              )
              .map((x: any) => {
                const latestEmail =
                  Array.isArray(x.membershipEmailEvents) &&
                  x.membershipEmailEvents.length
                    ? x.membershipEmailEvents[
                        x.membershipEmailEvents.length - 1
                      ]
                    : null;
                return (
                  <div
                    key={x._id}
                    className="rounded border border-white/10 bg-black/30 p-2"
                  >
                    <div>{x.email || x.userId || "-"}</div>
                    <div>
                      Plan: {toTitleLabel(String(x.previousPlan || "free"))} →{" "}
                      {toTitleLabel(String(x.currentPlan || "unknown"))}
                    </div>
                    <div>
                      Tier:{" "}
                      {toTitleLabel(String(x.previousBlackCardTier || "none"))}{" "}
                      → {toTitleLabel(String(x.blackCardTier || "unknown"))}
                    </div>
                    <div>
                      Event:{" "}
                      {toTitleLabel(String(x.lastMembershipEventType || "-"))} •
                      Review:{" "}
                      {toTitleLabel(
                        String(x.membershipReviewStatus || "pending_review"),
                      )}
                    </div>
                    <div>
                      Payment:{" "}
                      {x.lastPaymentSessionId || x.sourceStripeSessionId || "-"}{" "}
                      /{" "}
                      {x.lastPaymentIntentId || x.sourcePaymentIntentId || "-"}
                    </div>
                    <div>
                      Status:{" "}
                      {toTitleLabel(String(x.membershipStatus || "active"))} •
                      Email:{" "}
                      {latestEmail
                        ? latestEmail.sent
                          ? "sent"
                          : `failed (${latestEmail.error || "error"})`
                        : "none"}
                    </div>
                    <div>
                      Reviewed: {x.reviewedBy || "-"} at {fmtDate(x.reviewedAt)}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <button
                        onClick={() => reviewMembership(x._id, "approved")}
                        className="rounded border border-green-500/30 px-2 py-1"
                      >
                        Approve / Confirm Membership
                      </button>
                      <button
                        onClick={() => reviewMembership(x._id, "rejected")}
                        className="rounded border border-red-500/30 px-2 py-1"
                      >
                        Reject / Flag Issue
                      </button>
                      <button
                        onClick={() =>
                          reviewMembership(x._id, "needs_attention")
                        }
                        className="rounded border border-yellow-500/30 px-2 py-1"
                      >
                        Mark Needs Attention
                      </button>
                      <button
                        onClick={() => reviewMembership(x._id, "corrected")}
                        className="rounded border border-blue-500/30 px-2 py-1"
                      >
                        Correct Plan/Tier
                      </button>
                      <button
                        onClick={() =>
                          reviewMembership(x._id, "pending_review")
                        }
                        className="rounded border border-white/30 px-2 py-1"
                      >
                        Set Pending Review
                      </button>
                    </div>
                  </div>
                );
              })}
            {lifecycleItems.length === 0 ? (
              <p className="text-white/70">
                No membership lifecycle records yet.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-bold text-yellow-200">
            A2. Membership Email Events
          </h2>
          <div className="mt-3 space-y-2 text-xs">
            {membershipEmailEvents.filter((e) => !e.sent).length ? (
              membershipEmailEvents
                .filter((e) => !e.sent)
                .map((e, i) => (
                  <div
                    key={`fail-${i}`}
                    className="rounded border border-red-500/30 bg-red-500/10 p-2"
                  >
                    <div>
                      {fmtDate(e.at)} • FAILED • {e.recipient || e.email || "-"}
                    </div>
                    <div>
                      Plan/Tier: {toTitleLabel(String(e.plan || "-"))} /{" "}
                      {toTitleLabel(String(e.cardTier || "-"))}
                    </div>
                    <div>Type: {toTitleLabel(String(e.type || "-"))}</div>
                    <div>Error: {e.error || "-"}</div>
                    <div>
                      Session: {e.stripeSessionId || "-"} • Payment:{" "}
                      {e.paymentIntentId || "-"}
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-white/70">
                No failed membership emails found.
              </p>
            )}

            <div className="mt-3 text-sm font-semibold text-yellow-200">
              Recent membership email events
            </div>
            {membershipEmailEvents.map((e, i) => (
              <div
                key={`evt-${i}`}
                className="rounded border border-white/10 bg-black/30 p-2"
              >
                <div>
                  {fmtDate(e.at)} • {e.sent ? "SENT" : "FAILED"} •{" "}
                  {e.recipient || e.email || "-"}
                </div>
                <div>
                  Plan/Tier: {toTitleLabel(String(e.plan || "-"))} /{" "}
                  {toTitleLabel(String(e.cardTier || "-"))}
                </div>
                <div>Type: {toTitleLabel(String(e.type || "-"))}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-bold text-yellow-200">B. Cards</h2>
          {loading ? (
            <p className="mt-3 text-sm text-white/70">Loading...</p>
          ) : error ? (
            <p className="mt-3 text-sm text-red-300">{error}</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="text-white/70">
                  <tr>
                    <th className="pr-4 py-2">Type</th>
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
                    const test = isTestRecord(
                      c.email,
                      c.memberId,
                      c.publicVerificationId,
                    );
                    return (
                      <tr
                        key={c.cardId}
                        className="border-t border-white/10 align-top"
                      >
                        <td className="pr-4 py-2">{test ? "TEST" : "LIVE"}</td>
                        <td className="pr-4 py-2">{c.memberId || "—"}</td>
                        <td className="pr-4 py-2">{c.cardType || "—"}</td>
                        <td className="pr-4 py-2">
                          {toTitleLabel(c.cardStatus || "—")}
                        </td>
                        <td className="pr-4 py-2 break-all">
                          <div>{c.userId || "—"}</div>
                          <div className="text-white/60">{c.email || "—"}</div>
                        </td>
                        <td className="pr-4 py-2 break-all">
                          <div>{c.publicVerificationId || "—"}</div>
                          {verifyLink ? (
                            <Link
                              className="text-yellow-300 underline"
                              href={verifyLink}
                            >
                              Open verification
                            </Link>
                          ) : null}
                        </td>
                        <td className="pr-4 py-2">{fmtDate(c.createdAt)}</td>
                        <td className="pr-4 py-2">{fmtDate(c.updatedAt)}</td>
                        <td className="pr-4 py-2">
                          <div className="flex flex-wrap gap-1">
                            {c.cardStatus !== "active" ? (
                              <button
                                onClick={() => cardAction(c.cardId, "activate")}
                                className="rounded border border-green-500/30 px-2 py-1"
                              >
                                Activate card
                              </button>
                            ) : null}
                            <button
                              onClick={() => cardAction(c.cardId, "suspend")}
                              className="rounded border border-yellow-500/30 px-2 py-1"
                            >
                              Suspend card
                            </button>
                            <button
                              onClick={() => cardAction(c.cardId, "revoke")}
                              className="rounded border border-red-500/30 px-2 py-1"
                            >
                              Revoke card
                            </button>
                            <button
                              onClick={() => cardAction(c.cardId, "replace")}
                              className="rounded border border-blue-500/30 px-2 py-1"
                            >
                              Replace card
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {cardRows.length === 0 ? (
                <p className="text-sm text-white/70">
                  No Black Cards issued yet
                </p>
              ) : null}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-bold text-yellow-200">
            B. Digital Black Card Requests
          </h2>
          {actionMessage ? (
            <p className="mt-2 text-sm text-yellow-200">{actionMessage}</p>
          ) : null}
          <div className="mt-3 space-y-2 text-sm">
            {digitalRequests.map((r) => (
              <div
                key={r.requestId}
                className="rounded border border-white/10 bg-black/30 p-3"
              >
                <div>
                  {r.fullName || "—"} ({r.email || r.userId || "—"}){" "}
                  {isTestRecord(r.email, r.fullName) ? (
                    <span className="ml-2 rounded border border-yellow-500/40 px-2 py-0.5 text-[10px] text-yellow-200">
                      TEST_BC_LIFECYCLE
                    </span>
                  ) : null}
                </div>
                <div>
                  Plan/account status: {toTitleLabel(r.accountStatus)} /{" "}
                  {toTitleLabel(r.currentPlan)}
                </div>
                <div>Request status: {toTitleLabel(r.status)}</div>
                <div>
                  Card status: {r.memberId ? "Active" : "Not requested"}
                </div>
                <div>Issued date: {fmtDate(r.approvedAt || r.updatedAt)}</div>
                <div>Verification ID: {r.publicVerificationId || "—"}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {r.status === "pending" ? (
                    <>
                      <button
                        onClick={() =>
                          setDigitalRequestStatus(r.requestId, "approve")
                        }
                        className="rounded border border-green-500/30 px-2 py-1"
                      >
                        Approve digital request
                      </button>
                      <button
                        onClick={() =>
                          setDigitalRequestStatus(r.requestId, "reject")
                        }
                        className="rounded border border-red-500/30 px-2 py-1"
                      >
                        Reject
                      </button>
                    </>
                  ) : null}

                  {r.status === "approved" ? (
                    <>
                      <span className="rounded border border-green-500/30 bg-green-500/10 px-2 py-1 text-green-200">
                        Approved — Digital Card Issued
                      </span>
                      {r.memberId || r.publicVerificationId ? (
                        <>
                          <Link
                            href="/dashboard/black-card"
                            className="rounded border border-yellow-500/30 px-2 py-1 text-yellow-200"
                          >
                            View issued card
                          </Link>
                          {r.publicVerificationId ? (
                            <Link
                              href={`/black-card/verify/${r.publicVerificationId}`}
                              className="rounded border border-yellow-500/30 px-2 py-1 text-yellow-200"
                            >
                              Open verification page
                            </Link>
                          ) : null}
                          {r.memberId ? (
                            <span className="rounded border border-white/20 px-2 py-1 text-white/80">
                              Card status: Active
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <span className="rounded border border-yellow-500/30 bg-yellow-500/10 px-2 py-1 text-yellow-100">
                            Approved but card issuance record is missing.
                          </span>
                          <span className="rounded border border-white/20 px-2 py-1 text-white/80">
                            Action: Review issuance record.
                          </span>
                        </>
                      )}
                    </>
                  ) : null}

                  {r.status === "rejected" ? (
                    <>
                      <span className="rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-red-200">
                        Rejected
                      </span>
                      <span className="rounded border border-white/20 px-2 py-1 text-white/70">
                        No action available
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
            {digitalRequests.length === 0 ? (
              <p className="text-white/70">No digital requests yet</p>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-bold text-yellow-200">
            C. Physical Card Requests
          </h2>
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
                  <tr
                    key={r.requestId}
                    className="border-t border-white/10 align-top"
                  >
                    <td className="pr-4 py-2 break-all">
                      <div>{r.requestId}</div>
                      <div className="text-white/60">
                        {r.email || r.userId || "—"}
                      </div>
                    </td>
                    <td className="pr-4 py-2">{r.nameToPrint || "—"}</td>
                    <td className="pr-4 py-2">
                      {toTitleLabel(r.status || "—")}
                    </td>
                    <td className="pr-4 py-2 break-all">
                      <div>Member: {r.memberId || "—"}</div>
                      <div className="text-white/60">
                        Card: {r.cardId || r.cardSerial || "—"}
                      </div>
                    </td>
                    <td className="pr-4 py-2 break-all">
                      <div>Vendor ref: {r.vendorRef || "—"}</div>
                      <div>Tracking: {r.trackingNumber || "—"}</div>
                    </td>
                    <td className="pr-4 py-2">{fmtDate(r.updatedAt)}</td>
                    <td className="pr-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => requestAction(r.requestId, "approve")}
                          className="rounded border border-green-500/30 px-2 py-1"
                        >
                          Approve physical request
                        </button>
                        <button
                          onClick={() =>
                            requestAction(r.requestId, "sent_to_vendor")
                          }
                          className="rounded border border-yellow-500/30 px-2 py-1"
                        >
                          Mark sent to vendor
                        </button>
                        <button
                          onClick={() => requestAction(r.requestId, "shipped")}
                          className="rounded border border-blue-500/30 px-2 py-1"
                        >
                          Mark shipped
                        </button>
                        <button
                          onClick={() =>
                            requestAction(r.requestId, "delivered")
                          }
                          className="rounded border border-purple-500/30 px-2 py-1"
                        >
                          Mark delivered
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {requestRows.length === 0 ? (
              <p className="text-sm text-white/70">
                No physical card requests yet
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-bold text-yellow-200">
            C. Rewards Ledger
          </h2>
          <p className="mt-2 text-xs text-white/70">
            Ledger shows points issued (credits) and points redeemed (debits),
            with reason and posting status for audit clarity.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="text-white/70">
                <tr>
                  <th className="pr-4 py-2">User</th>
                  <th className="pr-4 py-2">Points +/-</th>
                  <th className="pr-4 py-2">Reason</th>
                  <th className="pr-4 py-2">Timestamp</th>
                  <th className="pr-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-white/10 align-top"
                  >
                    <td className="pr-4 py-2 break-all">{row.user}</td>
                    <td
                      className={`pr-4 py-2 font-semibold ${row.points >= 0 ? "text-green-300" : "text-red-300"}`}
                    >
                      {row.points >= 0 ? `+${row.points}` : `${row.points}`}
                    </td>
                    <td className="pr-4 py-2">{row.reason || "—"}</td>
                    <td className="pr-4 py-2">{fmtDate(row.timestamp)}</td>
                    <td className="pr-4 py-2">
                      {toTitleLabel(row.status || "posted")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ledger.length === 0 ? (
              <p className="text-sm text-white/70">
                No rewards ledger entries yet
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-bold text-yellow-200">D. Redemptions</h2>
          <p className="mt-2 text-xs text-white/70">
            Redemptions may require admin action. Use Approve, Reject, and
            Fulfilled controls to move each request through status.
          </p>
          <div className="mt-3 space-y-2 text-sm">
            {redemptions.slice(0, 100).map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-white/10 bg-black/30 p-3"
              >
                <div>Action: {toTitleLabel(item.rewardType || "reward")}</div>
                <div>Points: +{Number(item.pointsCost || 0)}</div>
                <div>Status: {toTitleLabel(item.status || "pending")}</div>
                <div>User: {maskUserId(item.userId)}</div>
                <div>Time: {fmtDate(item.createdAt)}</div>
                <div className="mt-2 flex gap-2">
                  {item.status === "pending" ? (
                    <>
                      <button
                        onClick={() => setRedemptionStatus(item.id, "approved")}
                        className="rounded border border-yellow-500/30 px-2 py-1 text-xs text-yellow-200"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setRedemptionStatus(item.id, "rejected")}
                        className="rounded border border-red-500/30 px-2 py-1 text-xs text-red-200"
                      >
                        Reject
                      </button>
                    </>
                  ) : null}
                  {item.status === "approved" ? (
                    <button
                      onClick={() => setRedemptionStatus(item.id, "fulfilled")}
                      className="rounded border border-green-500/30 px-2 py-1 text-xs text-green-200"
                    >
                      Mark Fulfilled
                    </button>
                  ) : null}
                  {item.status === "fulfilled" ? (
                    <span className="rounded border border-green-500/30 px-2 py-1 text-xs text-green-200">
                      Fulfilled
                    </span>
                  ) : null}
                  {item.status === "rejected" ? (
                    <span className="rounded border border-red-500/30 px-2 py-1 text-xs text-red-200">
                      Rejected
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          {redemptions.length === 0 ? (
            <p className="text-sm text-white/70">No redemptions found</p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-bold text-yellow-200">
            E. Manual Adjustments
          </h2>
          <form
            onSubmit={submitAdjust}
            className="mt-3 grid gap-3 sm:grid-cols-4"
          >
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="User ID"
              className="rounded bg-black/40 px-3 py-2 text-sm"
            />
            <input
              value={pointsDelta}
              onChange={(e) => setPointsDelta(e.target.value)}
              placeholder="Points Delta"
              className="rounded bg-black/40 px-3 py-2 text-sm"
            />
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason"
              className="rounded bg-black/40 px-3 py-2 text-sm"
            />
            <button className="rounded bg-yellow-500 px-3 py-2 text-sm font-semibold text-black">
              Submit points adjustment
            </button>
          </form>
          {adjustMsg ? (
            <p className="mt-2 text-sm text-yellow-200">{adjustMsg}</p>
          ) : null}
        </section>
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps<PageProps> = async ({
  req,
}) => {
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

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const ledgerDocs = await db
      .collection("black_card_rewards_ledger")
      .find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray();

    const userIds = Array.from(
      new Set(
        ledgerDocs
          .map((d: any) => String(d.userId || ""))
          .filter((id) => ObjectId.isValid(id)),
      ),
    );

    const users = userIds.length
      ? await db
          .collection("users")
          .find({ _id: { $in: userIds.map((id) => new ObjectId(id)) } })
          .project({ _id: 1, email: 1 })
          .toArray()
      : [];

    const emailByUserId = new Map<string, string>();
    for (const u of users as any[]) {
      emailByUserId.set(String(u._id), String(u.email || ""));
    }

    const initialLedger: LedgerRow[] = ledgerDocs.map((row: any) => {
      const uid = String(row.userId || "");
      const email = emailByUserId.get(uid);
      return {
        id: String(row._id),
        user: email || maskUserId(uid),
        points: Number(row.points || 0),
        reason: String(
          row.reason || row.actionType || row.rewardType || "",
        ).trim(),
        timestamp: row.createdAt ? new Date(row.createdAt).toISOString() : null,
        status: String(row.status || "posted"),
      };
    });

    const initialTotalPointsIssued = ledgerDocs.reduce(
      (sum: number, row: any) => {
        const points = Number(row.points || 0);
        return points > 0 ? sum + points : sum;
      },
      0,
    );

    return {
      props: {
        initialLedger,
        initialTotalPointsIssued,
      },
    };
  } catch {
    return {
      redirect: {
        destination: "/login?redirect=/admin/black-card",
        permanent: false,
      },
    };
  }
};
