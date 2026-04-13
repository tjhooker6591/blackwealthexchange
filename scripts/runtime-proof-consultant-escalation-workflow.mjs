#!/usr/bin/env node
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { MongoClient, ObjectId } from "mongodb";

dotenv.config({ path: ".env.local" });

const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

if (!mongoUri || !dbName || !secret) {
  console.error("Missing MONGODB_URI/MONGODB_DB/JWT_SECRET|NEXTAUTH_SECRET");
  process.exit(1);
}

async function req(path, { method = "GET", body, cookie } = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}

  return { status: res.status, json, text };
}

const client = new MongoClient(mongoUri);
let requestId;
let escalationId;

try {
  await client.connect();
  const db = client.db(dbName);
  const requests = db.collection("employer_consultant_contact_requests");

  const requestDocId = new ObjectId();
  requestId = String(requestDocId);

  await requests.insertOne({
    _id: requestDocId,
    consultantId: String(new ObjectId()),
    employerId: String(new ObjectId()),
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const adminEmail = `proof-admin-${Date.now()}@example.com`;
  const token = jwt.sign(
    {
      userId: String(new ObjectId()),
      email: adminEmail,
      accountType: "admin",
      role: "admin",
      isAdmin: true,
    },
    secret,
    { expiresIn: "1h" },
  );
  const cookie = `session_token=${token}; accountType=admin`;

  const checks = [];

  const escalate = await req("/api/admin/consultant-moderation-queue", {
    method: "PATCH",
    cookie,
    body: {
      requestId,
      disposition: "escalated",
      note: "Needs trust and legal review",
    },
  });

  checks.push({
    name: "escalate_action_ok",
    pass: escalate.status === 200 && escalate.json?.ok === true,
  });

  escalationId = escalate.json?.escalationId || null;
  checks.push({
    name: "escalation_id_returned",
    pass: Boolean(escalationId),
  });

  const escalationsOpen = await req("/api/admin/consultant-escalations?status=open", {
    cookie,
  });
  const openItems = Array.isArray(escalationsOpen.json?.items)
    ? escalationsOpen.json.items
    : [];

  const openMatch = openItems.find(
    (item) => item.requestId === requestId && item.status === "open",
  );

  checks.push({
    name: "open_escalation_visible_in_queue",
    pass:
      escalationsOpen.status === 200 &&
      escalationsOpen.json?.ok === true &&
      Boolean(openMatch),
  });

  const close = await req("/api/admin/consultant-escalations", {
    method: "PATCH",
    cookie,
    body: {
      escalationId,
      status: "closed",
      resolutionNote: "Reviewed and closed after admin follow-up",
    },
  });

  checks.push({
    name: "close_escalation_ok",
    pass: close.status === 200 && close.json?.ok === true,
  });

  const escalationsClosed = await req(
    "/api/admin/consultant-escalations?status=closed",
    { cookie },
  );
  const closedItems = Array.isArray(escalationsClosed.json?.items)
    ? escalationsClosed.json.items
    : [];

  const closedMatch = closedItems.find(
    (item) => item.id === escalationId && item.status === "closed",
  );

  checks.push({
    name: "closed_escalation_visible_in_queue",
    pass:
      escalationsClosed.status === 200 &&
      escalationsClosed.json?.ok === true &&
      Boolean(closedMatch),
  });

  const failed = checks.filter((c) => !c.pass).length;

  console.log(
    JSON.stringify(
      {
        baseUrl,
        requestId,
        escalationId,
        totals: { total: checks.length, passed: checks.length - failed, failed },
        checks,
      },
      null,
      2,
    ),
  );

  if (failed > 0) process.exitCode = 1;
} finally {
  try {
    const db = client.db(dbName);
    if (requestId) {
      await db
        .collection("consultant_moderation_escalations")
        .deleteMany({ requestId });
      await db.collection("employer_consultant_contact_requests").deleteOne({
        _id: new ObjectId(requestId),
      });
    }
  } catch {}

  await client.close().catch(() => {});
}
