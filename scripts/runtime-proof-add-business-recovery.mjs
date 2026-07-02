#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import jwt from "jsonwebtoken";
import { MongoClient } from "mongodb";
import { chromium } from "playwright";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    const value = line.slice(i + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

const BASE = process.env.PROOF_BASE_URL || "http://127.0.0.1:3002";
const MONGO_URI = process.env.MONGODB_URI;
const SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
const DB_NAME = process.env.MONGODB_DB || "bwes-cluster";
const USER_EMAIL = process.env.PROOF_USER_EMAIL || "tjameshooker@gmail.com";
const PNG_PATH = "/tmp/openclaw-add-business-proof.png";
const NO_IMAGE_NAME = `OpenClaw Add Business Proof No Image ${Date.now()}`;
const FAIL_IMAGE_NAME = `OpenClaw Add Business Proof Fail Image ${Date.now()}`;

if (!MONGO_URI || !SECRET) throw new Error("Missing env");
if (!fs.existsSync(PNG_PATH))
  throw new Error(`Missing proof image: ${PNG_PATH}`);

const client = new MongoClient(MONGO_URI);
await client.connect();
const db = client.db(DB_NAME);
const user = await db
  .collection("users")
  .findOne({ email: USER_EMAIL }, { projection: { _id: 1, email: 1 } });
if (!user) throw new Error("Owner user not found");

const token = jwt.sign(
  { userId: String(user._id), email: user.email, accountType: "user" },
  SECRET,
  { expiresIn: "2h" },
);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ baseURL: BASE });
await context.addCookies([
  { name: "session_token", value: token, domain: "127.0.0.1", path: "/" },
  { name: "accountType", value: "business", domain: "127.0.0.1", path: "/" },
]);
const page = await context.newPage();
const responses = [];
page.on("response", async (res) => {
  const url = res.url();
  if (url.includes("/api/business/create")) {
    let body = "";
    try {
      body = await res.text();
    } catch {}
    responses.push({ url, status: res.status(), body });
  }
});

function field(sel) {
  return page.locator(sel);
}

async function fillCommon(name) {
  await field('input[type="text"]').nth(0).fill(name);
  await page.locator("select").selectOption("tech");
  await page
    .getByPlaceholder("City, State (for example: Allentown, PA)")
    .fill("Atlanta, GA");
  await page.locator('input[type="tel"]').fill("4045551212");
  await page
    .locator('input[type="email"]')
    .fill(`proof+${Date.now()}@example.com`);
  await page.getByPlaceholder("yourbusiness.com").fill("example.com");
  await page
    .locator("textarea")
    .fill(
      "Proof business submission used to verify add-business image recovery behavior.",
    );
  await page
    .getByPlaceholder("facebook.com/yourbusiness")
    .fill("facebook.com/proof");
  await page.getByPlaceholder("x.com/yourbusiness").fill("x.com/proof");
}

const out = { base: BASE, steps: {}, responses };

try {
  await page.goto("/business-directory/add-business", {
    waitUntil: "networkidle",
  });
  out.steps.pageLoaded = page.url();
  out.steps.initialBodySnippet = (await page.locator("body").innerText()).slice(
    0,
    800,
  );

  await fillCommon(NO_IMAGE_NAME);
  await page.locator('input[type="file"]').setInputFiles(PNG_PATH);
  out.steps.previewVisible = await page.getByText("Image Preview").isVisible();
  await page.getByRole("button", { name: "Remove Image" }).click();
  out.steps.previewRemoved = !(await page
    .getByText("Image Preview")
    .isVisible()
    .catch(() => false));
  out.steps.fieldsPreservedAfterRemove = {
    businessName: await page.locator('input[type="text"]').nth(0).inputValue(),
    category: await page.locator("select").inputValue(),
    location: await page
      .getByPlaceholder("City, State (for example: Allentown, PA)")
      .inputValue(),
  };

  await page.getByRole("button", { name: "Submit Business" }).click();
  await page.waitForTimeout(1500);
  out.steps.noImageSuccessVisible = await page
    .getByText("Business Submitted")
    .isVisible()
    .catch(() => false);

  await page.goto("/business-directory/add-business", {
    waitUntil: "networkidle",
  });
  await fillCommon(FAIL_IMAGE_NAME);
  await page.locator('input[type="file"]').setInputFiles(PNG_PATH);
  out.steps.previewVisibleBeforeFailure = await page
    .getByText("Image Preview")
    .isVisible();
  await page.getByRole("button", { name: "Replace Image" }).click();
  await page.locator('input[type="file"]').setInputFiles(PNG_PATH);
  out.steps.replaceStillHasPreview = await page
    .getByText("Image Preview")
    .isVisible();

  await page.getByRole("button", { name: "Submit Business" }).click();
  await page.waitForTimeout(2000);
  out.steps.errorAfterImageSubmit = await page
    .locator("text=Cloudinary is not configured")
    .first()
    .textContent()
    .catch(() => null);
  out.steps.formPreservedAfterFailure = {
    businessName: await page.locator('input[type="text"]').nth(0).inputValue(),
    category: await page.locator("select").inputValue(),
    location: await page
      .getByPlaceholder("City, State (for example: Allentown, PA)")
      .inputValue(),
    previewStillVisible: await page
      .getByText("Image Preview")
      .isVisible()
      .catch(() => false),
  };

  await page.getByRole("button", { name: "Remove Image" }).click();
  out.steps.previewRemovedAfterFailure = !(await page
    .getByText("Image Preview")
    .isVisible()
    .catch(() => false));
  await page.getByRole("button", { name: "Submit Business" }).click();
  await page.waitForTimeout(1500);
  out.steps.retrySuccessVisible = await page
    .getByText("Business Submitted")
    .isVisible()
    .catch(() => false);

  const created = await db
    .collection("businesses")
    .find(
      {
        business_name: { $in: [NO_IMAGE_NAME, FAIL_IMAGE_NAME] },
      },
      { projection: { business_name: 1, createdAt: 1, image: 1, logo: 1 } },
    )
    .toArray();
  out.steps.createdRecords = created.map((d) => ({ _id: String(d._id), ...d }));
  out.steps.createdRecordCount = created.length;

  console.log(JSON.stringify(out, null, 2));
} finally {
  await browser.close();
  await client.close();
}
