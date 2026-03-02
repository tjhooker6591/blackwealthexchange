// src/pages/api/admin/get-directory-listings.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import cookie from "cookie";
import jwt from "jsonwebtoken";

type Decoded = {
  userId?: string;
  email?: string;
  accountType?: string;
  role?: string;
  isAdmin?: boolean;
  roles?: string[];
};

type AdminRow = {
  _id?: any;
  source: "directory_listings" | "payments_fallback";

  businessName?: string | null;
  businessId?: string | null;
  businessIdReal?: string | null;
  userId?: string | null;
  email?: string | null;

  status?: string | null;
  listingStatus?: string | null;
  paymentStatus?: string | null;

  paid?: boolean;
  tier?: "standard" | "featured" | string | null;
  featuredSlot?: number | null;
  queuePosition?: number | null;
  featuredEndDate?: string | null;
  expiresAt?: string | null;
  createdAt?: string | null;
  paidAt?: string | null;
  updatedAt?: string | null;

  needsAttention?: boolean;
  linkedListingExists?: boolean;
  fulfillmentStatus?: string | null;

  stripeSessionId?: string | null;
  paymentIntentId?: string | null;
  itemId?: string | null;
  amountCents?: number | null;
  durationDays?: number | null;
  placement?: string | null;
  campaignId?: string | null;
};

function isAdmin(decoded: Decoded) {
  if (decoded?.isAdmin) return true;
  if (decoded?.accountType === "admin") return true;
  if (decoded?.role === "admin") return true;
  if (Array.isArray(decoded?.roles) && decoded.roles.includes("admin"))
    return true;

  const allow = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (allow.length && decoded?.email) {
    return allow.includes(decoded.email.toLowerCase());
  }

  return false;
}

function parseIntSafe(v: unknown, def: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}

function s(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function iso(v: unknown): string | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v as any);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function normalize(v: unknown): string {
  return String(v || "")
    .trim()
    .toLowerCase();
}

function pickDirectoryItemId(doc: any): string | null {
  return (
    s(doc?.itemId) ||
    s(doc?.metadata?.itemId) ||
    s(doc?.option) ||
    s(doc?.metadata?.option) ||
    null
  );
}

function inferTier(itemId: string | null): "standard" | "featured" | null {
  if (itemId === "directory-standard") return "standard";
  if (itemId === "directory-featured") return "featured";
  return null;
}

function isDirectoryItem(itemId: string | null) {
  return itemId === "directory-standard" || itemId === "directory-featured";
}

function getPaymentStateFromListing(doc: any): "paid" | "pending" | "refunded" {
  const explicit = normalize(doc?.paymentStatus);
  if (explicit === "paid") return "paid";
  if (explicit === "refunded") return "refunded";
  if (explicit === "pending") return "pending";

  if (doc?.paid === true) return "paid";
  if (doc?.paidAt) return "paid";

  return "pending";
}

function getListingStateFromListing(
  doc: any,
): "unlinked" | "pending_approval" | "approved" | "active" | "expired" {
  const explicit = normalize(doc?.listingStatus);
  if (
    explicit === "unlinked" ||
    explicit === "pending_approval" ||
    explicit === "approved" ||
    explicit === "active" ||
    explicit === "expired"
  ) {
    return explicit as
      | "unlinked"
      | "pending_approval"
      | "approved"
      | "active"
      | "expired";
  }

  const status = normalize(doc?.status);
  if (
    status === "unlinked" ||
    status === "pending_approval" ||
    status === "approved" ||
    status === "active" ||
    status === "expired"
  ) {
    return status as
      | "unlinked"
      | "pending_approval"
      | "approved"
      | "active"
      | "expired";
  }

  if (doc?.needsAttention) return "unlinked";
  return "pending_approval";
}

function getPaymentStateFromPayment(doc: any): "paid" | "pending" | "refunded" {
  const st = normalize(doc?.status || doc?.paymentStatus);
  if (st === "paid") return "paid";
  if (st === "refunded") return "refunded";
  return "pending";
}

function getListingStateFromPayment(
  doc: any,
  linked: boolean,
):
  | "unlinked"
  | "pending_approval"
  | "approved"
  | "active"
  | "expired"
  | "fallback" {
  const paymentState = getPaymentStateFromPayment(doc);
  const businessId = s(doc?.businessId) || s(doc?.metadata?.businessId);

  if (paymentState !== "paid") return "fallback";
  if (linked) return "active";
  if (!businessId) return "unlinked";
  return "pending_approval";
}

function passesSearch(row: AdminRow, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    row.businessName,
    row.businessId,
    row.businessIdReal,
    row.userId,
    row.email,
    row.itemId,
    row.stripeSessionId,
    row.paymentIntentId,
    row.fulfillmentStatus,
    row.status,
    row.listingStatus,
    row.paymentStatus,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.session_token;

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  let decoded: Decoded;
  try {
    const SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!SECRET) throw new Error("JWT_SECRET missing");
    decoded = jwt.verify(token, SECRET) as Decoded;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (process.env.NODE_ENV === "production" && !isAdmin(decoded)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const {
      status = "all",
      tier = "all",
      q = "",
      page = "1",
      limit = "100",
      source = "auto",
    } = req.query as Record<string, string>;

    const pageNum = parseIntSafe(page, 1);
    const limitNum = Math.min(parseIntSafe(limit, 100), 250);

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const directoryCol = db.collection("directory_listings");
    const paymentsCol = db.collection("payments");

    // Load both sources for a truthful combined admin view
    const [directoryListings, payments] = await Promise.all([
      directoryCol.find({}).sort({ paidAt: -1, createdAt: -1 }).toArray(),
      paymentsCol
        .find({
          $and: [
            {
              $or: [
                { type: "ad" },
                { type: "advertising" },
                { "metadata.type": "ad" },
                { "metadata.type": "advertising" },
              ],
            },
            {
              $or: [
                {
                  itemId: { $in: ["directory-standard", "directory-featured"] },
                },
                {
                  "metadata.itemId": {
                    $in: ["directory-standard", "directory-featured"],
                  },
                },
                {
                  option: { $in: ["directory-standard", "directory-featured"] },
                },
                {
                  "metadata.option": {
                    $in: ["directory-standard", "directory-featured"],
                  },
                },
              ],
            },
          ],
        })
        .sort({ paidAt: -1, createdAt: -1 })
        .toArray(),
    ]);

    const linkedSessionIdSet = new Set(
      directoryListings
        .map((x: any) => s(x?.stripeSessionId))
        .filter((x): x is string => Boolean(x)),
    );

    // Normalize directory_listings rows
    const normalizedListings: AdminRow[] = directoryListings.map((doc: any) => {
      const paymentStatus = getPaymentStateFromListing(doc);
      const listingStatus = getListingStateFromListing(doc);
      const businessIdReal = s(doc?.businessIdReal);
      const businessId = businessIdReal || s(doc?.businessId);

      return {
        _id: doc._id,
        source: "directory_listings",

        businessName: s(doc?.businessName),
        businessId,
        businessIdReal,
        userId: s(doc?.userId),
        email: s(doc?.email),

        status: s(doc?.status),
        listingStatus,
        paymentStatus,

        paid: !!doc?.paid,
        tier: s(doc?.tier),
        featuredSlot:
          typeof doc?.featuredSlot === "number" ? doc.featuredSlot : null,
        queuePosition:
          typeof doc?.queuePosition === "number" ? doc.queuePosition : null,
        featuredEndDate: iso(doc?.featuredEndDate),
        expiresAt: iso(doc?.expiresAt),
        createdAt: iso(doc?.createdAt),
        paidAt: iso(doc?.paidAt),
        updatedAt: iso(doc?.updatedAt),

        needsAttention: !!doc?.needsAttention,
        linkedListingExists: true,
        fulfillmentStatus:
          listingStatus === "unlinked" ? "needs_business_link" : "linked",

        stripeSessionId: s(doc?.stripeSessionId) || s(doc?.lastStripeSessionId),
        paymentIntentId: s(doc?.paymentIntentId),
        itemId:
          s(doc?.itemId) ||
          s(doc?.metadata?.canonicalItemId) ||
          s(doc?.metadata?.normalizedItemId),
        amountCents:
          typeof doc?.amountCents === "number" ? doc.amountCents : null,
        durationDays:
          typeof doc?.durationDays === "number"
            ? doc.durationDays
            : typeof doc?.metadata?.durationDays === "number"
              ? doc.metadata.durationDays
              : null,
        placement: s(doc?.placement) || s(doc?.metadata?.placement),
        campaignId: s(doc?.campaignId) || s(doc?.metadata?.campaignId),
      };
    });

    // Normalize payments into fallback rows ONLY when not already linked by session
    const fallbackRows: AdminRow[] = payments
      .map((p: any) => {
        const itemId = pickDirectoryItemId(p);
        if (!isDirectoryItem(itemId)) return null;

        const stripeSessionId = s(p?.stripeSessionId);
        const linked = stripeSessionId
          ? linkedSessionIdSet.has(stripeSessionId)
          : false;

        // do not duplicate real directory rows in combined admin view
        if (linked && source !== "payments") return null;

        const paymentStatus = getPaymentStateFromPayment(p);
        const listingStatus = getListingStateFromPayment(p, linked);
        const businessId = s(p?.businessId) || s(p?.metadata?.businessId);
        const userId = s(p?.userId) || s(p?.metadata?.userId);

        let fulfillmentStatus = "awaiting_payment";
        if (paymentStatus === "paid") {
          if (linked) fulfillmentStatus = "linked";
          else if (!businessId) fulfillmentStatus = "needs_business_link";
          else fulfillmentStatus = "paid_not_activated";
        } else if (paymentStatus === "pending") {
          fulfillmentStatus = "awaiting_webhook_or_completion";
        } else if (paymentStatus === "refunded") {
          fulfillmentStatus = "refunded";
        }

        return {
          _id: p._id,
          source: "payments_fallback",

          businessName: null,
          businessId,
          businessIdReal: businessId,
          userId,
          email: s(p?.email),

          status:
            listingStatus === "fallback" ? "payment_pending" : listingStatus,
          listingStatus,
          paymentStatus,

          paid: paymentStatus === "paid",
          tier: inferTier(itemId),
          featuredSlot: null,
          queuePosition: null,
          featuredEndDate: null,
          expiresAt: null,
          createdAt: iso(p?.createdAt),
          paidAt: iso(p?.paidAt),
          updatedAt: iso(p?.updatedAt),

          needsAttention: paymentStatus === "paid" && (!businessId || !linked),
          linkedListingExists: linked,
          fulfillmentStatus,

          stripeSessionId,
          paymentIntentId: s(p?.paymentIntentId),
          itemId,
          amountCents:
            typeof p?.amountCents === "number" ? p.amountCents : null,
          durationDays:
            typeof p?.durationDays === "number"
              ? p.durationDays
              : typeof p?.metadata?.durationDays === "number"
                ? p.metadata.durationDays
                : typeof p?.metadata?.durationDays === "string"
                  ? Number(p.metadata.durationDays)
                  : null,
          placement: s(p?.placement) || s(p?.metadata?.placement),
          campaignId: s(p?.campaignId) || s(p?.metadata?.campaignId),
        };
      })
      .filter(Boolean) as AdminRow[];

    let combined =
      source === "directory"
        ? normalizedListings
        : source === "payments"
          ? fallbackRows
          : [...normalizedListings, ...fallbackRows];

    // Filters
    combined = combined.filter((row) => {
      if (tier !== "all" && row.tier !== tier) return false;

      if (status !== "all") {
        const listingState = normalize(row.listingStatus);
        const paymentState = normalize(row.paymentStatus);
        if (
          listingState !== normalize(status) &&
          paymentState !== normalize(status)
        ) {
          return false;
        }
      }

      if (q && !passesSearch(row, q)) return false;

      return true;
    });

    // Sort newest paid/created first
    combined.sort((a, b) => {
      const ad = new Date(a.paidAt || a.createdAt || 0).getTime();
      const bd = new Date(b.paidAt || b.createdAt || 0).getTime();
      return bd - ad;
    });

    const total = combined.length;
    const skip = (pageNum - 1) * limitNum;
    const paged = combined.slice(skip, skip + limitNum);

    const summary = {
      paid: combined.filter((x) => x.paymentStatus === "paid").length,
      pendingPayment: combined.filter((x) => x.paymentStatus === "pending")
        .length,
      refunded: combined.filter((x) => x.paymentStatus === "refunded").length,
      unlinked: combined.filter((x) => x.listingStatus === "unlinked").length,
      pendingApproval: combined.filter(
        (x) => x.listingStatus === "pending_approval",
      ).length,
      approved: combined.filter((x) => x.listingStatus === "approved").length,
      active: combined.filter((x) => x.listingStatus === "active").length,
      expired: combined.filter((x) => x.listingStatus === "expired").length,
      fallback: combined.filter((x) => x.source === "payments_fallback").length,
      needsAttention: combined.filter((x) => !!x.needsAttention).length,
    };

    return res.status(200).json({
      ok: true,
      source:
        source === "directory"
          ? "directory_listings"
          : source === "payments"
            ? "payments_fallback"
            : "combined",
      page: pageNum,
      limit: limitNum,
      total,
      listings: paged,
      summary,
    });
  } catch (err) {
    console.error("[/api/admin/get-directory-listings] error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
