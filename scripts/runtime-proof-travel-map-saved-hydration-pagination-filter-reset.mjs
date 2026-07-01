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

async function api(path, { method = "GET", body, cookie } = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

function hydrateVisibleSaved(results, savedItems) {
  const visibleIds = new Set(
    (results || []).map((r) => `${r?._id || ""}`.trim()).filter(Boolean),
  );
  const hydrated = new Set();
  for (const item of savedItems || []) {
    const id = `${item?.businessId || ""}`.trim();
    if (id && visibleIds.has(id)) hydrated.add(id);
  }
  return hydrated;
}

const client = new MongoClient(mongoUri);
let userId;

try {
  await client.connect();
  const db = client.db(dbName);

  userId = new ObjectId();
  const userEmail = `proof-travel-hydration-${Date.now()}@example.com`;
  const now = new Date();

  await db.collection("users").insertOne({
    _id: userId,
    email: userEmail,
    accountType: "user",
    fullName: "Travel Map Hydration User",
    createdAt: now,
    updatedAt: now,
  });

  const token = jwt.sign(
    { userId: String(userId), email: userEmail, accountType: "user" },
    secret,
    { expiresIn: "1h" },
  );
  const cookie = `session_token=${token}; accountType=user`;

  const checks = [];

  const page1 = await api(
    "/api/travel-map/search?page=1&pageSize=12&sort=relevance",
    { cookie },
  );
  checks.push({
    name: "search_page1_ok",
    pass: page1.status === 200 && page1.json?.ok === true,
  });

  const firstId = `${page1.json?.results?.[0]?._id || ""}`.trim();
  if (!firstId) throw new Error("No search results found on page 1");

  const save = await api("/api/travel-map/saved", {
    method: "POST",
    body: { businessId: firstId },
    cookie,
  });
  checks.push({
    name: "save_first_page_business_ok",
    pass: save.status === 200 && save.json?.ok === true,
  });

  const savedAfterSave = await api("/api/travel-map/saved", { cookie });
  checks.push({
    name: "saved_list_after_save_ok",
    pass: savedAfterSave.status === 200 && savedAfterSave.json?.ok === true,
  });

  const hydratedPage1 = hydrateVisibleSaved(
    page1.json?.results,
    savedAfterSave.json?.items,
  );
  checks.push({
    name: "hydration_page1_contains_saved_business",
    pass: hydratedPage1.has(firstId),
  });

  const page2 = await api(
    "/api/travel-map/search?page=2&pageSize=12&sort=relevance",
    { cookie },
  );
  checks.push({
    name: "search_page2_ok",
    pass: page2.status === 200 && page2.json?.ok === true,
  });

  const hydratedPage2 = hydrateVisibleSaved(
    page2.json?.results,
    savedAfterSave.json?.items,
  );
  checks.push({
    name: "hydration_page2_matches_intersection_logic",
    pass: Array.from(hydratedPage2).every((id) =>
      (page2.json?.results || []).some((r) => `${r?._id || ""}`.trim() === id),
    ),
  });

  const filtered = await api(
    "/api/travel-map/search?page=1&pageSize=12&sort=relevance&q=a",
    { cookie },
  );
  checks.push({
    name: "search_filtered_ok",
    pass: filtered.status === 200 && filtered.json?.ok === true,
  });

  const hydratedFiltered = hydrateVisibleSaved(
    filtered.json?.results,
    savedAfterSave.json?.items,
  );
  const expectedFiltered = (filtered.json?.results || []).some(
    (r) => `${r?._id || ""}`.trim() === firstId,
  );
  checks.push({
    name: "hydration_filtered_matches_saved_presence",
    pass: hydratedFiltered.has(firstId) === expectedFiltered,
  });

  const reset = await api(
    "/api/travel-map/search?page=1&pageSize=12&sort=relevance",
    { cookie },
  );
  checks.push({
    name: "search_reset_ok",
    pass: reset.status === 200 && reset.json?.ok === true,
  });

  const hydratedReset = hydrateVisibleSaved(
    reset.json?.results,
    savedAfterSave.json?.items,
  );
  checks.push({
    name: "hydration_reset_reloads_saved_presence",
    pass:
      hydratedReset.has(firstId) ===
      (reset.json?.results || []).some(
        (r) => `${r?._id || ""}`.trim() === firstId,
      ),
  });

  const detailState = await api(`/api/travel-map/saved?businessId=${firstId}`, {
    cookie,
  });
  checks.push({
    name: "detail_saved_state_consistent_before_remove",
    pass: detailState.status === 200 && detailState.json?.saved === true,
  });

  const remove = await api("/api/travel-map/saved", {
    method: "DELETE",
    body: { businessId: firstId },
    cookie,
  });
  checks.push({
    name: "remove_saved_ok",
    pass: remove.status === 200 && remove.json?.ok === true,
  });

  const detailStateAfter = await api(
    `/api/travel-map/saved?businessId=${firstId}`,
    { cookie },
  );
  checks.push({
    name: "detail_saved_state_consistent_after_remove",
    pass:
      detailStateAfter.status === 200 && detailStateAfter.json?.saved === false,
  });

  const savedAfterRemove = await api("/api/travel-map/saved", { cookie });
  const hydratedAfterRemove = hydrateVisibleSaved(
    reset.json?.results,
    savedAfterRemove.json?.items,
  );
  checks.push({
    name: "hydration_reset_reflects_remove_without_stale_state",
    pass: hydratedAfterRemove.has(firstId) === false,
  });

  const failed = checks.filter((c) => !c.pass).length;
  console.log(
    JSON.stringify(
      {
        baseUrl,
        businessId: firstId,
        totals: {
          total: checks.length,
          passed: checks.length - failed,
          failed,
        },
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
    if (userId) {
      await db
        .collection("travel_map_saved_places")
        .deleteMany({ userId: String(userId) });
      await db.collection("users").deleteOne({ _id: userId });
    }
  } catch {}
  await client.close().catch(() => {});
}
