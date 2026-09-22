#!/usr/bin/env node
import fs from "node:fs";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { MongoClient, ObjectId } from "mongodb";
import { chromium } from "playwright";

dotenv.config({ path: '.env.local' });

const base = process.env.BASE_URL || 'http://127.0.0.1:3000';
const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

if (!mongoUri || !dbName || !secret) {
  console.error('Missing MONGODB_URI/MONGODB_DB/JWT_SECRET|NEXTAUTH_SECRET');
  process.exit(1);
}

const outDir = '.audit/founding-membership-button';
fs.mkdirSync(outDir, { recursive: true });

const client = new MongoClient(mongoUri);
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
const page = await context.newPage();

const consoleEvents = [];
const pageErrors = [];
const requests = [];
const responses = [];

page.on('console', (msg) => consoleEvents.push({ type: msg.type(), text: msg.text() }));
page.on('pageerror', (err) => pageErrors.push(String(err?.stack || err)));
page.on('request', (req) => requests.push({ url: req.url(), method: req.method(), postData: req.postData() }));
page.on('response', async (res) => {
  const entry = { url: res.url(), status: res.status(), ok: res.ok() };
  if (res.url().includes('/api/stripe/checkout')) {
    try { entry.body = await res.text(); } catch {}
  }
  responses.push(entry);
});

function mask(text) {
  return String(text || '')
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[email]')
    .replace(/\b(cs_test_[A-Za-z0-9_]+)\b/g, (m) => `${m.slice(0, 12)}***`)
    .replace(/\b(cs_live_[A-Za-z0-9_]+)\b/g, (m) => `${m.slice(0, 12)}***`)
    .replace(/\b(sess_[A-Za-z0-9_]+)\b/g, (m) => `${m.slice(0, 10)}***`);
}

const result = { base, consoleEvents, pageErrors, requests, responses, steps: {} };
let proofUserId = null;

try {
  await client.connect();
  const db = client.db(dbName);
  const users = db.collection('users');
  proofUserId = new ObjectId();
  const stamp = Date.now();
  const proofEmail = `founding-proof-${stamp}@example.com`;
  await users.insertOne({
    _id: proofUserId,
    email: proofEmail,
    accountType: 'user',
    fullName: 'Founding Membership Proof User',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const token = jwt.sign({ userId: String(proofUserId), email: proofEmail, accountType: 'user', tokenVersion: 0 }, secret, { expiresIn: '1h' });
  await context.addCookies([
    { name: 'session_token', value: token, domain: '127.0.0.1', path: '/', httpOnly: true, secure: false, sameSite: 'Lax' },
    { name: 'accountType', value: 'user', domain: '127.0.0.1', path: '/', httpOnly: false, secure: false, sameSite: 'Lax' },
  ]);

  const optionsRes = await fetch(`${base}/api/founding-membership/options`);
  const options = await optionsRes.json();
  const claimable = (options?.businesses || []).find((b) => b?.claimable);
  if (!claimable) throw new Error('No claimable business found');

  await page.goto(`${base}/founding-membership?businessId=${encodeURIComponent(claimable.id)}`, { waitUntil: 'networkidle' });
  await page.click('button:has-text("Continue With This Business")');
  await page.waitForTimeout(200);

  result.steps.beforeClick = {
    url: page.url(),
    buttonEnabled: await page.locator('button:has-text("Start Membership and Claim Process")').isEnabled(),
    selectedBusiness: claimable.businessName,
  };

  await page.click('button:has-text("Start Membership and Claim Process")');
  await page.waitForTimeout(4000);

  result.steps.afterClick = {
    finalUrl: page.url(),
    loginVisible: page.url().includes('/login'),
    stripeVisible: page.url().includes('checkout.stripe.com'),
    visibleText: await page.locator('body').innerText().catch(() => ''),
    checkoutRequests: requests.filter((r) => r.url.includes('/api/stripe/checkout')).map((r) => ({ url: r.url, method: r.method, postData: mask(r.postData) })),
    checkoutResponses: responses.filter((r) => r.url.includes('/api/stripe/checkout')).map((r) => ({ url: r.url, status: r.status, ok: r.ok, body: mask(r.body) })),
    screenshot: `${outDir}/authenticated-after-click.png`,
  };

  await page.screenshot({ path: `${outDir}/authenticated-after-click.png`, fullPage: true });
  result.consoleEvents = consoleEvents.map((x) => ({ ...x, text: mask(x.text) }));
  result.requests = requests.map((x) => ({ ...x, postData: mask(x.postData) }));
  result.responses = responses.map((x) => ({ ...x, body: mask(x.body) }));
  result.steps.afterClick.visibleText = mask(result.steps.afterClick.visibleText).slice(0, 1200);

  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  result.error = String(error?.stack || error);
  result.consoleEvents = consoleEvents.map((x) => ({ ...x, text: mask(x.text) }));
  result.requests = requests.map((x) => ({ ...x, postData: mask(x.postData) }));
  result.responses = responses.map((x) => ({ ...x, body: mask(x.body) }));
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = 1;
} finally {
  try {
    if (proofUserId) {
      await client.db(dbName).collection('users').deleteOne({ _id: proofUserId });
    }
  } catch {}
  await client.close();
  await browser.close();
}
