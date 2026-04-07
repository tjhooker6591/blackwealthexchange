import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";

function s(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function normalizeEventType(body: Record<string, unknown>) {
  const raw =
    s(body.eventType) || s(body.event) || s(body.action) || s(body.name);

  if (!raw) return "";

  return raw.slice(0, 100);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    const eventType = normalizeEventType(body);

    // Keep validation, but do not restrict to the old search-only allowlist.
    if (!eventType || !/^[a-zA-Z0-9._:-\s]{2,100}$/.test(eventType)) {
      return res.status(400).json({ error: "Invalid eventType" });
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    await ensureApiRateLimitIndexes(db);

    const ip = getClientIp(req);
    const ipLimit = await hitApiRateLimit(db, `flow-event:ip:${ip}`, 300, 5);
    if (ipLimit.blocked) {
      return res.status(429).json({ error: "Too many requests" });
    }

    await db.collection("flow_events").insertOne({
      eventType,

      businessId: s(body.businessId) || null,
      businessAlias: s(body.businessAlias) || null,
      source: s(body.source) || null,
      query: s(body.query) || null,
      category: s(body.category) || null,
      state: s(body.state) || null,
      path: s(body.path) || req.url || null,

      // Phase 1 canonical analytics context
      pageRoute: s(body.pageRoute) || null,
      section: s(body.section) || null,
      ctaId: s(body.ctaId) || null,
      ctaLabel: s(body.ctaLabel) || null,
      destination: s(body.destination) || null,
      accountType: s(body.accountType) || null,
      isAuthenticated:
        typeof body.isAuthenticated === "boolean" ? body.isAuthenticated : null,
      environment: s(body.environment) || process.env.NODE_ENV || null,
      sourceVariant: s(body.source_variant) || s(body.sourceVariant) || null,

      planTier: s(body.plan_tier) || s(body.planTier) || null,
      billingCycle: s(body.billing_cycle) || s(body.billingCycle) || null,

      adType: s(body.ad_type) || s(body.adType) || null,
      packageType: s(body.package_type) || s(body.packageType) || null,
      checkoutVariant:
        s(body.checkout_variant) || s(body.checkoutVariant) || null,

      sellerState: s(body.seller_state) || s(body.sellerState) || null,
      onboardingVariant:
        s(body.onboarding_variant) || s(body.onboardingVariant) || null,

      // search/discovery structured fields
      entityId: s(body.entity_id) || s(body.entityId) || null,
      entityType: s(body.entity_type) || s(body.entityType) || null,
      jobId: s(body.job_id) || s(body.jobId) || null,
      productId: s(body.product_id) || s(body.productId) || null,
      resultCount:
        typeof body.result_count === "number"
          ? body.result_count
          : typeof body.resultCount === "number"
            ? body.resultCount
            : null,
      resultRank:
        typeof body.result_rank === "number"
          ? body.result_rank
          : typeof body.resultRank === "number"
            ? body.resultRank
            : null,
      filterKey: s(body.filter_key) || s(body.filterKey) || null,
      filterValue: s(body.filter_value) || s(body.filterValue) || null,

      // homepage / guided-flow legacy context
      surface: s(body.surface) || null,
      location: s(body.location) || null,
      cta: s(body.cta) || null,
      label: s(body.label) || null,
      target: s(body.target) || null,
      href: s(body.href) || null,

      createdAt: new Date(),
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("flow-events error", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
