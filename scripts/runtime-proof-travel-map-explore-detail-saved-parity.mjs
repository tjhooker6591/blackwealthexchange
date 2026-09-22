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

try {
  await client.connect();
  const db = client.db(dbName);

  userId = new ObjectId();
  const now = new Date();
  const userEmail = `proof-travel-parity-${Date.now()}@example.com`;

  await db.collection("users").insertOne({
    _id: userId,
    email: userEmail,
    accountType: "user",
    fullName: "Travel Map Parity User",
    createdAt: now,
    updatedAt: now,
  });

  const token = jwt.sign(
    { userId: String(userId), email: userEmail, accountType: "user" },
    secret,
    { expiresIn: "1h" },
  );

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

  await page.goto(`/travel-map/explore`, { waitUntil: "networkidle" });

  const card = page
    .locator("article")
    .filter({ has: page.getByRole("link", { name: "Travel Map Detail" }) })
    .first();
  await card.waitFor({ state: "visible", timeout: 20000 });

  const detailHref = await card
    .getByRole("link", { name: "Travel Map Detail" })
    .getAttribute("href");

  if (!detailHref || !detailHref.includes("/travel-map/business/")) {
    throw new Error("Could not resolve detail href from explore card");
  }

  const businessId = detailHref.split("/travel-map/business/")[1] || "";
  if (!businessId) {
    throw new Error("Could not parse businessId from detail href");
  }

  const initialSaveBtn = card.getByRole("button", { name: "Save" });
  checks.push({
    name: "explore_initial_state_save_visible",
    pass: await initialSaveBtn.isVisible(),
  });

  await initialSaveBtn.click();
  const removeSavedBtn = card.getByRole("button", { name: "Remove saved" });
  await removeSavedBtn.waitFor({ state: "visible", timeout: 10000 });
  checks.push({
    name: "explore_after_save_remove_visible",
    pass: await removeSavedBtn.isVisible(),
  });

  const savedBadge = card.getByText("Saved", { exact: true }).first();
  checks.push({
    name: "explore_saved_badge_visible",
    pass: await savedBadge.isVisible(),
  });

  await card.getByRole("link", { name: "Travel Map Detail" }).click();
  await page.waitForURL(`**/travel-map/business/${businessId}`);

  const detailRemoveBtn = page.getByRole("button", { name: "Remove saved" });
  await detailRemoveBtn.waitFor({ state: "visible", timeout: 10000 });
  checks.push({
    name: "detail_reflects_saved_state",
    pass: await detailRemoveBtn.isVisible(),
  });

  await detailRemoveBtn.click();
  const detailSaveBtn = page.getByRole("button", { name: "Save" });
  await detailSaveBtn.waitFor({ state: "visible", timeout: 10000 });
  checks.push({
    name: "detail_remove_updates_to_save",
    pass: await detailSaveBtn.isVisible(),
  });

  await page.goto(`/travel-map/explore`, { waitUntil: "networkidle" });
  const cardAgain = page
    .locator("article")
    .filter({
      has: page.locator(`a[href='/travel-map/business/${businessId}']`),
    })
    .first();
  await cardAgain.waitFor({ state: "visible", timeout: 20000 });

  const saveAgainBtn = cardAgain.getByRole("button", { name: "Save" });
  checks.push({
    name: "explore_reflects_detail_remove",
    pass: await saveAgainBtn.isVisible(),
  });

  const failed = checks.filter((c) => !c.pass).length;
  const summary = {
    baseUrl,
    businessId,
    totals: {
      total: checks.length,
      passed: checks.length - failed,
      failed,
    },
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
