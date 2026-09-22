import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";
const outDir = path.resolve(".audit/runtime-proof-def");

async function ensureDir() {
  await fs.mkdir(outDir, { recursive: true });
}

async function proofDSignupRedirectGuard(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.route("**/api/auth/signup", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        accountType: "seller",
        stripeOnboardingLink: "https://evil.example/phish",
      }),
    });
  });

  await page.goto(`${BASE_URL}/signup?type=seller`, {
    waitUntil: "domcontentloaded",
  });
  await page.fill('input[name="email"]', `guard-${Date.now()}@example.com`);
  await page.fill('input[name="password"]', "StrongPass1!");
  await page.fill('input[name="confirmPassword"]', "StrongPass1!");
  await page.click('button[type="submit"]');

  await page.waitForSelector(
    "text=Unexpected onboarding destination. Please retry.",
  );
  const stayedOnSignup = /\/signup/.test(new URL(page.url()).pathname);

  await page.screenshot({
    path: path.join(outDir, "d-signup-redirect-guard.png"),
    fullPage: true,
  });
  await context.close();
  return { stayedOnSignup };
}

async function proofDAdminUnauthorizedMessage(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.route("**/api/admin/get-users", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: "Unauthorized" }),
    });
  });

  await page.goto(`${BASE_URL}/admin/user-management`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector(
    "text=Admin access required to view user records.",
  );
  await page.screenshot({
    path: path.join(outDir, "d-admin-unauthorized-message.png"),
    fullPage: true,
  });

  await context.close();
  return { unauthorizedBannerVisible: true };
}

async function proofESeoTags(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/wealth-builder/status`, {
    waitUntil: "domcontentloaded",
  });
  const canonical = await page
    .locator('head link[rel="canonical"]')
    .first()
    .getAttribute("href");
  const ogTitle = await page
    .locator('head meta[property="og:title"]')
    .first()
    .getAttribute("content");

  await page.goto(`${BASE_URL}/admin/user-management`, {
    waitUntil: "domcontentloaded",
  });
  const robots = await page
    .locator('head meta[name="robots"]')
    .first()
    .getAttribute("content");

  await context.close();
  return { canonical, ogTitle, robots };
}

async function proofFNextBestAction(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.route("**/api/wealth-builder/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        status: {
          userId: "u_f",
          email: "proof@example.com",
          entitlement: {
            productKey: "wealth_builder_premium",
            tier: "free",
            status: "active",
            isPremium: false,
            limits: {
              maxSavingsGoals: 2,
              currentMonthBudgetOnly: true,
              insightsEnabled: false,
              budgetHistoryEnabled: false,
            },
          },
          summary: {
            debtCount: 0,
            goalCount: 0,
            activeGoalCount: 0,
            budgetCount: 0,
            transactionCount: 0,
            wealthBuilderPaymentCount: 0,
            lastWealthBuilderPaymentStatus: null,
            lastWealthBuilderPaymentAt: null,
          },
          recentWealthBuilderPayments: [],
        },
      }),
    });
  });

  await page.goto(`${BASE_URL}/wealth-builder/status`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector("text=Next best action");
  await page.waitForSelector("text=Add your first transaction");
  await page.click(
    'a[href="/wealth-builder/transactions"]:has-text("Do this now")',
  );
  await page.waitForURL("**/wealth-builder/transactions");

  await page.screenshot({
    path: path.join(outDir, "f-next-best-action.png"),
    fullPage: true,
  });
  const destination = page.url();

  await context.close();
  return { destination };
}

async function main() {
  await ensureDir();
  const browser = await chromium.launch({ headless: true });
  const summary = {};

  try {
    summary.D = {
      signupGuard: await proofDSignupRedirectGuard(browser),
      adminUnauthorized: await proofDAdminUnauthorizedMessage(browser),
    };
    summary.E = await proofESeoTags(browser);
    summary.F = await proofFNextBestAction(browser);
  } finally {
    await browser.close();
  }

  const summaryPath = path.join(outDir, "summary.json");
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  console.log(`Saved ${summaryPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
