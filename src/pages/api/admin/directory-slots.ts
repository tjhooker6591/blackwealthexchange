// src/pages/api/admin/directory-slots.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

const DEFAULT_MAX_SLOTS = 10;
const DEFAULT_EXPIRING_SOON_DAYS = 7;

function getMaxSlots() {
  const raw = Number(process.env.DIRECTORY_FEATURED_MAX_SLOTS || "");
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_MAX_SLOTS;
}

function getExpiringSoonDays() {
  const raw = Number(process.env.DIRECTORY_EXPIRING_SOON_DAYS || "");
  return Number.isFinite(raw) && raw > 0
    ? Math.floor(raw)
    : DEFAULT_EXPIRING_SOON_DAYS;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? null : value;
  const d = new Date(value as any);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalize(v: unknown) {
  return String(v || "")
    .trim()
    .toLowerCase();
}

function isPaidLike(doc: any) {
  const paymentStatus = normalize(doc?.paymentStatus);
  if (paymentStatus === "paid") return true;
  if (paymentStatus === "pending" || paymentStatus === "refunded") return false;

  return Boolean(doc?.paid === true || doc?.paidAt);
}

function pickExpiry(doc: any): Date | null {
  // Prefer featuredEndDate for slot occupancy; fall back to expiresAt
  return toDate(doc?.featuredEndDate) || toDate(doc?.expiresAt);
}

function pickSlot(doc: any): number | null {
  const n = Number(doc?.featuredSlot);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

function pickListingState(doc: any) {
  return normalize(doc?.listingStatus || doc?.status);
}

function pickFirstOpenSlots(usedSlots: number[], maxSlots: number) {
  const used = new Set(
    usedSlots.filter((n) => Number.isFinite(n) && n >= 1 && n <= maxSlots),
  );

  const open: number[] = [];
  for (let i = 1; i <= maxSlots; i++) {
    if (!used.has(i)) open.push(i);
  }
  return open;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const now = new Date();

    const MAX_SLOTS = getMaxSlots();
    const EXPIRING_SOON_DAYS = getExpiringSoonDays();
    const expiringSoonCutoff = new Date(
      now.getTime() + EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000,
    );

    const directoryCol = db.collection("directory_listings");

    // Pull featured rows once, then classify in code using new + legacy status model
    const featuredDocs = await directoryCol
      .find({ tier: "featured" })
      .sort({ featuredSlot: 1, queuePosition: 1, approvedAt: 1, createdAt: 1 })
      .toArray();

    // 1) Active slot occupants
    const featured = featuredDocs
      .filter((doc: any) => {
        const listingState = pickListingState(doc);
        const slot = pickSlot(doc);
        const expiry = pickExpiry(doc);

        if (!slot) return false;
        if (listingState !== "active") return false;
        if (expiry && expiry <= now) return false;

        const hasPaidField =
          "paymentStatus" in doc || "paid" in doc || "paidAt" in doc;
        if (hasPaidField && !isPaidLike(doc)) return false;

        return true;
      })
      .map((doc: any) => ({
        ...doc,
        _slot: pickSlot(doc),
        _expiry: pickExpiry(doc)?.toISOString() || null,
        _listingState: pickListingState(doc),
        _isPaidLike: isPaidLike(doc),
      }))
      .sort((a: any, b: any) => (a._slot || 0) - (b._slot || 0));

    // 2) Queue candidates
    // New model:
    // - featured + approved + no slot => waitlist
    // Legacy:
    // - status queued / pending_slot / approved with no slot
    const waitlist = featuredDocs
      .filter((doc: any) => {
        const listingState = pickListingState(doc);
        const slot = pickSlot(doc);
        const expiry = pickExpiry(doc);

        if (slot) return false;
        if (expiry && expiry <= now) return false;

        // queue-like states
        const queueLike =
          listingState === "approved" ||
          listingState === "queued" ||
          listingState === "pending_slot";

        if (!queueLike) return false;

        const hasPaidField =
          "paymentStatus" in doc || "paid" in doc || "paidAt" in doc;
        if (hasPaidField && !isPaidLike(doc)) return false;

        return true;
      })
      .map((doc: any, idx: number) => ({
        ...doc,
        queuePosition:
          typeof doc?.queuePosition === "number" &&
          Number.isFinite(doc.queuePosition)
            ? doc.queuePosition
            : idx + 1,
        _expiry: pickExpiry(doc)?.toISOString() || null,
        _listingState: pickListingState(doc),
        _isPaidLike: isPaidLike(doc),
      }))
      .sort((a: any, b: any) => {
        const aq = Number.isFinite(a?.queuePosition) ? a.queuePosition : 999999;
        const bq = Number.isFinite(b?.queuePosition) ? b.queuePosition : 999999;
        if (aq !== bq) return aq - bq;

        const ad = toDate(a?.approvedAt || a?.createdAt)?.getTime() || 0;
        const bd = toDate(b?.approvedAt || b?.createdAt)?.getTime() || 0;
        return ad - bd;
      });

    // 3) Slot calculations
    const usedSlots = featured
      .map((f: any) => Number(f?._slot))
      .filter((n) => Number.isFinite(n) && n >= 1 && n <= MAX_SLOTS);

    const openSlots = pickFirstOpenSlots(usedSlots, MAX_SLOTS);
    const slotsFilled = usedSlots.length;
    const slotsAvailable = Math.max(0, MAX_SLOTS - slotsFilled);

    // 4) Next up in queue
    const nextUp = waitlist[0] || null;

    // 5) Expiring soon (active featured slots only)
    const expiringSoon = featured.filter((f: any) => {
      const expiry = pickExpiry(f);
      return Boolean(expiry && expiry > now && expiry <= expiringSoonCutoff);
    });

    // 6) Useful summary counts for Admin dashboard widgets
    const summary = {
      activeFeatured: featured.length,
      queuedFeatured: waitlist.length,
      needsAttention: [...featuredDocs].filter((x: any) => x?.needsAttention)
        .length,
      expiringSoon: expiringSoon.length,
      unlinkedFeatured: featuredDocs.filter(
        (x: any) => pickListingState(x) === "unlinked",
      ).length,
      pendingApprovalFeatured: featuredDocs.filter(
        (x: any) => pickListingState(x) === "pending_approval",
      ).length,
    };

    return res.status(200).json({
      ok: true,

      maxSlots: MAX_SLOTS,
      slotsFilled,
      slotsAvailable,
      openSlots,
      slotsInUse: usedSlots,

      featured,
      waitlist,
      nextUp,
      expiringSoon,

      expiringSoonWindowDays: EXPIRING_SOON_DAYS,
      summary,
      generatedAt: now.toISOString(),
    });
  } catch (err) {
    console.error("[/api/admin/directory-slots] error:", err);
    return res.status(500).json({ error: "Failed to load slot info" });
  }
}
