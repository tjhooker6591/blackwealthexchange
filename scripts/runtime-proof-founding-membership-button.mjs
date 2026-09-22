#!/usr/bin/env node
import fs from "node:fs";
import { chromium } from "playwright";

const base = process.env.BASE_URL || "http://127.0.0.1:3000";
const outDir = ".audit/founding-membership-button";
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
const page = await context.newPage();

const consoleEvents = [];
const pageErrors = [];
const requests = [];
const responses = [];

page.on("console", (msg) => {
  consoleEvents.push({ type: msg.type(), text: msg.text() });
});
page.on("pageerror", (err) => {
  pageErrors.push(String(err?.stack || err));
});
page.on("request", (req) => {
  requests.push({ url: req.url(), method: req.method(), postData: req.postData() });
});
page.on("response", async (res) => {
  const entry = { url: res.url(), status: res.status(), ok: res.ok() };
  if (res.url().includes("/api/stripe/checkout")) {
    try {
      entry.body = await res.text();
    } catch {}
  }
  responses.push(entry);
});

function safeMask(text) {
  return String(text || "")
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[email]")
    .replace(/\b(cs_test_[A-Za-z0-9_]+)\b/g, (m) => `${m.slice(0, 12)}***`)
    .replace(/\b(cs_live_[A-Za-z0-9_]+)\b/g, (m) => `${m.slice(0, 12)}***`);
}

const result = { base, consoleEvents, pageErrors, requests, responses, steps: {} };

try {
  const optionsRes = await fetch(`${base}/api/founding-membership/options`);
  const options = await optionsRes.json();
  const claimable = (options?.businesses || []).find((b) => b?.claimable);
  if (!claimable) throw new Error("No claimable business found for button proof");

  await page.goto(`${base}/founding-membership?businessId=${encodeURIComponent(claimable.id)}`, { waitUntil: "networkidle" });
  await page.click('button:has-text("Continue With This Business")');
  await page.waitForTimeout(500);

  result.steps.beforeClick = {
    url: page.url(),
    buttonEnabled: await page.locator('button:has-text("Start Membership and Claim Process")').isEnabled(),
    selectedBusinessVisible: await page.locator(`text=${claimable.businessName}`).first().isVisible().catch(() => false),
  };

  const clickPromise = page.click('button:has-text("Start Membership and Claim Process")');
  await clickPromise;
  await page.waitForTimeout(2500);

  const checkoutReqs = requests.filter((r) => r.url.includes('/api/stripe/checkout'));
  const checkoutRes = responses.filter((r) => r.url.includes('/api/stripe/checkout'));
  const visibleError = await page.locator('text=/Unable|Authentication required|Unauthorized|claim|pilot|checkout/i').allTextContents().catch(() => []);

  result.steps.afterClick = {
    url: page.url(),
    buttonDisabledNow: await page.locator('button:has-text("Start Membership and Claim Process")').isDisabled().catch(() => null),
    loginVisible: page.url().includes('/login'),
    checkoutRequests: checkoutReqs.map((r) => ({ url: r.url, method: r.method, postData: safeMask(r.postData) })),
    checkoutResponses: checkoutRes.map((r) => ({ url: r.url, status: r.status, ok: r.ok, body: safeMask(r.body) })),
    visibleError,
    screenshot: `${outDir}/after-click.png`,
  };

  await page.screenshot({ path: `${outDir}/after-click.png`, fullPage: true });

  result.consoleEvents = consoleEvents.map((x) => ({ ...x, text: safeMask(x.text) }));
  result.requests = requests.map((x) => ({ ...x, postData: safeMask(x.postData) }));
  result.responses = responses.map((x) => ({ ...x, body: safeMask(x.body) }));

  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  result.error = String(error?.stack || error);
  result.consoleEvents = consoleEvents.map((x) => ({ ...x, text: safeMask(x.text) }));
  result.requests = requests.map((x) => ({ ...x, postData: safeMask(x.postData) }));
  result.responses = responses.map((x) => ({ ...x, body: safeMask(x.body) }));
  console.log(JSON.stringify(result, null, 2));
  process.exit(1);
} finally {
  await browser.close();
}
