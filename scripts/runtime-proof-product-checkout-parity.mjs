#!/usr/bin/env node
import dotenv from "dotenv";
import Stripe from "stripe";
import { MongoClient, ObjectId } from "mongodb";

dotenv.config({ path: ".env.local" });

const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
const stripe = stripeSecret
  ? new Stripe(stripeSecret, { apiVersion: "2025-02-24.acacia" })
  : null;

if (!mongoUri || !dbName) {
  console.error("Missing MONGODB_URI or MONGODB_DB");
  process.exit(1);
}

function asIdString(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (v instanceof ObjectId) return v.toString();
  if (typeof v === "object" && typeof v.toString === "function") {
    const s = v.toString();
    return typeof s === "string" ? s : "";
  }
  return "";
}

async function post(path, body) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, json, text };
}

const client = new MongoClient(mongoUri);

try {
  await client.connect();
  const db = client.db(dbName);

  const products = db.collection("products");
  const sellers = db.collection("sellers");

  const candidateProducts = await products
    .find({})
    .project({ _id: 1, sellerId: 1, price: 1, stock: 1, inventory: 1 })
    .limit(200)
    .toArray();

  let selected = null;
  let selectedSellerId = "";

  for (const p of candidateProducts) {
    const price = Number(p.price || 0);
    const stock = Number(p.stock ?? p.inventory ?? 1);
    if (!Number.isFinite(price) || price <= 0) continue;
    if (Number.isFinite(stock) && stock <= 0) continue;

    const rawSellerId = asIdString(p.sellerId);
    const seller = await sellers.findOne({
      $or: [
        ...(rawSellerId ? [{ _id: rawSellerId }] : []),
        ...(ObjectId.isValid(rawSellerId) ? [{ _id: new ObjectId(rawSellerId) }] : []),
      ],
    });

    const acct = String(seller?.stripeAccountId || "").trim();
    if (!acct.startsWith("acct_")) continue;

    selected = p;
    selectedSellerId = asIdString(seller?._id) || rawSellerId;
    break;
  }

  if (!selected) {
    throw new Error("No eligible product+seller with Stripe account found for proof");
  }

  const productId = asIdString(selected._id);
  const proofUserId = new ObjectId().toString();

  const checks = [];

  const canonical = await post("/api/checkout/create-session", { productId });
  checks.push({
    name: "canonical_session_created",
    pass: canonical.status === 200 && Boolean(canonical.json?.sessionId),
  });

  const legacy = await post("/api/stripe/checkout", {
    type: "product",
    itemId: productId,
    userId: proofUserId,
  });
  checks.push({
    name: "legacy_session_created",
    pass: legacy.status === 200 && Boolean(legacy.json?.sessionId),
  });
  if (!checks[0].pass || !checks[1].pass) {
    console.log(
      JSON.stringify(
        {
          baseUrl,
          productId,
          blocked: true,
          blocker: "checkout endpoint unavailable for paid session creation",
          canonicalStatus: canonical.status,
          canonicalBody: canonical.json || canonical.text,
          legacyStatus: legacy.status,
          legacyBody: legacy.json || legacy.text,
          checks,
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }

  const canonicalFieldsPresent =
    Boolean(canonical.json?.orderId) &&
    Boolean(canonical.json?.payoutMode) &&
    Boolean(canonical.json?.sessionId);
  const legacyFieldsPresent =
    Boolean(legacy.json?.orderId) &&
    Boolean(legacy.json?.payoutMode) &&
    Boolean(legacy.json?.sessionId);

  checks.push({ name: "canonical_response_contract", pass: canonicalFieldsPresent });
  checks.push({ name: "legacy_response_contract", pass: legacyFieldsPresent });

  if (!stripe) {
    console.log(
      JSON.stringify(
        {
          baseUrl,
          productId,
          blocked: true,
          blocker: "STRIPE_SECRET_KEY missing for metadata retrieval parity proof",
          canonical: canonical.json,
          legacy: legacy.json,
          checks,
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }

  const cSession = await stripe.checkout.sessions.retrieve(canonical.json.sessionId);
  const lSession = await stripe.checkout.sessions.retrieve(legacy.json.sessionId);

  function validMeta(meta, expectedOrderId) {
    return (
      meta?.type === "product" &&
      meta?.orderId === expectedOrderId &&
      meta?.productId === productId &&
      Boolean(meta?.sellerId) &&
      Boolean(meta?.payoutMode)
    );
  }

  checks.push({
    name: "canonical_metadata_contract",
    pass: validMeta(cSession.metadata, canonical.json.orderId),
  });
  checks.push({
    name: "legacy_metadata_contract",
    pass: validMeta(lSession.metadata, legacy.json.orderId),
  });

  checks.push({
    name: "entrypoint_metadata_parity",
    pass:
      cSession.metadata?.type === lSession.metadata?.type &&
      cSession.metadata?.productId === lSession.metadata?.productId &&
      Boolean(cSession.metadata?.sellerId) &&
      Boolean(lSession.metadata?.sellerId) &&
      Boolean(cSession.metadata?.payoutMode) &&
      Boolean(lSession.metadata?.payoutMode),
  });

  const cOrder = await db
    .collection("orders")
    .findOne({ _id: new ObjectId(canonical.json.orderId) });
  const lOrder = await db
    .collection("orders")
    .findOne({ _id: new ObjectId(legacy.json.orderId) });

  function orderLinked(orderDoc, expectedSessionId) {
    return (
      Boolean(orderDoc) &&
      asIdString(orderDoc.productId) === productId &&
      orderDoc.sessionId === expectedSessionId &&
      orderDoc.stripeSessionId === expectedSessionId &&
      orderDoc.paymentSessionId === expectedSessionId
    );
  }

  checks.push({
    name: "canonical_order_linkage_consistent",
    pass: orderLinked(cOrder, canonical.json.sessionId),
  });
  checks.push({
    name: "legacy_order_linkage_consistent",
    pass: orderLinked(lOrder, legacy.json.sessionId),
  });

  checks.push({
    name: "no_contract_drift_between_entrypoints",
    pass:
      canonicalFieldsPresent &&
      legacyFieldsPresent &&
      validMeta(cSession.metadata, canonical.json.orderId) &&
      validMeta(lSession.metadata, legacy.json.orderId) &&
      orderLinked(cOrder, canonical.json.sessionId) &&
      orderLinked(lOrder, legacy.json.sessionId),
  });

  const failed = checks.filter((c) => !c.pass).length;

  console.log(
    JSON.stringify(
      {
        baseUrl,
        productId,
        sellerId: selectedSellerId,
        canonical: {
          sessionId: canonical.json?.sessionId || null,
          orderId: canonical.json?.orderId || null,
          payoutMode: canonical.json?.payoutMode || null,
        },
        legacy: {
          sessionId: legacy.json?.sessionId || null,
          orderId: legacy.json?.orderId || null,
          payoutMode: legacy.json?.payoutMode || null,
        },
        totals: { total: checks.length, passed: checks.length - failed, failed },
        checks,
      },
      null,
      2,
    ),
  );

  if (failed > 0) process.exitCode = 1;
} finally {
  await client.close().catch(() => {});
}
