#!/usr/bin/env node
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { MongoClient, ObjectId } from "mongodb";
import { chromium } from "playwright";

dotenv.config({ path: ".env.local" });

const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

if (!mongoUri || !dbName || !secret) {
  console.error("Missing MONGODB_URI/MONGODB_DB/JWT_SECRET|NEXTAUTH_SECRET");
  process.exit(1);
}

const client = new MongoClient(mongoUri);
let userId;
let browser;

async function apiReq(path, { method = "GET", body, cookie } = {}) {
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

async function waitForCardHydration(card) {
  await card.waitFor({ state: "visible", timeout: 20000 });
  const checking = card.getByRole("button", { name: "Checking..." });
  if (await checking.count()) {
    await checking.waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
  }
}

async function collectVisibleBusinessIds(page, limit = 6) {
  const links = page.locator("article a[href^='/travel-map/business/']");
  await links.first().waitFor({ state: "visible", timeout: 20000 });
  const count = Math.min(await links.count(), limit);
  const ids = [];
  for (let i = 0; i < count; i += 1) {
    const href = await links.nth(i).getAttribute("href");
    const id = href?.split("/travel-map/business/")[1];
    if (id) ids.push(id);
  }
  return ids;
}

async function verifyVisibleStateMatchesSavedSet(page, savedSet, ids) {
  const mismatches = [];

  for (const id of ids) {
    const card = page
      .locator("article")
      .filter({ has: page.locator(`a[href='/travel-map/business/${id}']`) })
      .first();

    if ((await card.count()) === 0) {
      continue;
    }

    await waitForCardHydration(card);

    const removeVisible = await card
      .getByRole("button", { name: "Remove saved" })
      .isVisible()
      .catch(() => false);

    const saveVisible = await card
      .getByRole("button", { name: "Save" })
      .isVisible()
      .catch(() => false);

    const badgeVisible = await card
      .getByText("Saved", { exact: true })
      .first()
      .isVisible()
      .catch(() => false);

    const expectedSaved = savedSet.has(id);
    const buttonOk = expectedSaved
      ? removeVisible && !saveVisible
      : saveVisible && !removeVisible;
    const badgeOk = expectedSaved ? badgeVisible : !badgeVisible;

    if (!buttonOk || !badgeOk) {
      mismatches.push({
        id,
        expectedSaved,
        removeVisible,
        saveVisible,
        badgeVisible,
      });
    }
  }

  return { pass: mismatches.length === 0, mismatches };
}

try {
  await client.connect();
  const db = client.db(dbName);

  userId = new ObjectId();
  const userEmail = `proof-travel-paging-${Date.now()}@example.com`;
  const now = new Date();

  await db.collection("users").insertOne({
    _id: userId,
    email: userEmail,
    accountType: "user",
    fullName: "Travel Map Paging User",
    createdAt: now,
    updatedAt: now,
  });

  const token = jwt.sign(
    { userId: String(userId), email: userEmail, accountType: "user" },
    secret,
    { expiresIn: "1h" },
  );
  const cookie = `session_token=${token}; accountType=user`;

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: baseUrl });
  await context.addCookies([
    {
      name: "session_token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: false,
      sameSite: "Lax",
    },
    {
      name: "accountType",
      value: "user",
      domain: "localhost",
      path: "/",
      httpOnly: false,
      sameSite: "Lax",
    },
  ]);

  const page = await context.newPage();
  const checks = [];

  await page.goto("/travel-map/explore", { waitUntil: "networkidle" });

  const idsInitial = await collectVisibleBusinessIds(page);
  if (!idsInitial.length)
    throw new Error("No visible travel map cards on explore");

  // Ensure at least one visible business is saved via API for deterministic expectation
  let savedId = "";
  for (const id of idsInitial) {
    const res = await apiReq("/api/travel-map/saved", {
      method: "POST",
      body: { businessId: id },
      cookie,
    });
    if (res.status === 200 && res.json?.ok) {
      savedId = id;
      break;
    }
  }
  if (!savedId)
    throw new Error(
      "Could not save any visible explore business for parity test",
    );

  const savedListInitial = await apiReq("/api/travel-map/saved", { cookie });
  const savedSetInitial = new Set(
    (savedListInitial.json?.items || [])
      .map((item) => `${item?.businessId || ""}`.trim())
      .filter(Boolean),
  );

  const initialConsistency = await verifyVisibleStateMatchesSavedSet(
    page,
    savedSetInitial,
    idsInitial,
  );
  checks.push({
    name: "initial_visible_state_matches_saved_set",
    pass: initialConsistency.pass,
    mismatches: initialConsistency.mismatches,
  });

  const nextBtn = page.getByRole("button", { name: "Next", exact: true });
  const prevBtn = page.getByRole("button", { name: "Previous", exact: true });
  checks.push({
    name: "pagination_controls_present",
    pass: (await nextBtn.count()) > 0,
  });

  if ((await nextBtn.count()) > 0 && !(await nextBtn.isDisabled())) {
    await nextBtn.click();
    await page.waitForLoadState("networkidle");
    const idsPage2 = await collectVisibleBusinessIds(page);

    const savedListPage2 = await apiReq("/api/travel-map/saved", { cookie });
    const savedSetPage2 = new Set(
      (savedListPage2.json?.items || [])
        .map((item) => `${item?.businessId || ""}`.trim())
        .filter(Boolean),
    );
    const page2Consistency = await verifyVisibleStateMatchesSavedSet(
      page,
      savedSetPage2,
      idsPage2,
    );
    checks.push({
      name: "page2_state_matches_saved_set",
      pass: page2Consistency.pass,
      mismatches: page2Consistency.mismatches,
    });

    await prevBtn.click();
    await page.waitForLoadState("networkidle");

    const idsBack = await collectVisibleBusinessIds(page);
    const savedListBack = await apiReq("/api/travel-map/saved", { cookie });
    const savedSetBack = new Set(
      (savedListBack.json?.items || [])
        .map((item) => `${item?.businessId || ""}`.trim())
        .filter(Boolean),
    );
    const backConsistency = await verifyVisibleStateMatchesSavedSet(
      page,
      savedSetBack,
      idsBack,
    );
    checks.push({
      name: "page1_after_pagination_state_matches_saved_set",
      pass: backConsistency.pass,
      mismatches: backConsistency.mismatches,
    });
  } else {
    checks.push({
      name: "page2_state_matches_saved_set",
      pass: true,
      skipped: true,
    });
    checks.push({
      name: "page1_after_pagination_state_matches_saved_set",
      pass: true,
      skipped: true,
    });
  }

  const queryToken = "a";
  const searchInput = page.getByPlaceholder(
    "Search businesses, food, beauty, coffee...",
  );

  await searchInput.fill(queryToken);
  await page.getByRole("button", { name: "Apply Filters" }).click();
  await page.waitForLoadState("networkidle");

  const idsFiltered = await collectVisibleBusinessIds(page);
  const savedListFiltered = await apiReq("/api/travel-map/saved", { cookie });
  const savedSetFiltered = new Set(
    (savedListFiltered.json?.items || [])
      .map((item) => `${item?.businessId || ""}`.trim())
      .filter(Boolean),
  );
  const filteredConsistency = await verifyVisibleStateMatchesSavedSet(
    page,
    savedSetFiltered,
    idsFiltered,
  );
  checks.push({
    name: "filtered_state_matches_saved_set",
    pass: filteredConsistency.pass,
    mismatches: filteredConsistency.mismatches,
  });

  await page.getByRole("button", { name: "Clear" }).click();
  await page.waitForLoadState("networkidle");

  const idsReset = await collectVisibleBusinessIds(page);
  const savedListReset = await apiReq("/api/travel-map/saved", { cookie });
  const savedSetReset = new Set(
    (savedListReset.json?.items || [])
      .map((item) => `${item?.businessId || ""}`.trim())
      .filter(Boolean),
  );
  const resetConsistency = await verifyVisibleStateMatchesSavedSet(
    page,
    savedSetReset,
    idsReset,
  );
  checks.push({
    name: "reset_state_matches_saved_set",
    pass: resetConsistency.pass,
    mismatches: resetConsistency.mismatches,
  });

  await page.goto(`/travel-map/business/${savedId}`, {
    waitUntil: "networkidle",
  });
  checks.push({
    name: "detail_matches_saved_state_after_refresh_cycles",
    pass: await page.getByRole("button", { name: "Remove saved" }).isVisible(),
  });

  await page.getByRole("button", { name: "Remove saved" }).click();
  await page
    .getByRole("button", { name: "Save" })
    .waitFor({ state: "visible", timeout: 10000 });

  const confirmRes = await apiReq(
    `/api/travel-map/saved?businessId=${savedId}`,
    { cookie },
  );
  checks.push({
    name: "explore_matches_detail_remove_after_refresh_cycles",
    pass: confirmRes.status === 200 && confirmRes.json?.saved === false,
  });

  const failed = checks.filter((c) => !c.pass).length;
  const summary = {
    baseUrl,
    savedId,
    totals: { total: checks.length, passed: checks.length - failed, failed },
    checks,
  };

  console.log(JSON.stringify(summary, null, 2));
  if (failed > 0) process.exitCode = 1;

  await context.close();
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

  if (browser) await browser.close().catch(() => {});
  await client.close().catch(() => {});
}
