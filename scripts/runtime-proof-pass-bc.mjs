import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";
const outDir = path.resolve(".audit/runtime-proof-pass-bc");

async function ensureDir() {
  await fs.mkdir(outDir, { recursive: true });
}

async function passBStatusProof(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.route("**/api/wealth-builder/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        status: {
          userId: "user_123",
          email: "proof@example.com",
          entitlement: {
            productKey: "wealth_builder_premium",
            tier: "premium",
            status: "active",
            isPremium: true,
            limits: {
              maxSavingsGoals: null,
              currentMonthBudgetOnly: false,
              insightsEnabled: true,
              budgetHistoryEnabled: true,
            },
          },
          summary: {
            debtCount: 2,
            goalCount: 3,
            activeGoalCount: 2,
            budgetCount: 1,
            transactionCount: 7,
            wealthBuilderPaymentCount: 1,
            lastWealthBuilderPaymentStatus: "paid",
            lastWealthBuilderPaymentAt: new Date().toISOString(),
          },
          recentWealthBuilderPayments: [
            {
              stripeSessionId: "cs_test_pass_b",
              itemId: "wealth_builder_premium",
              productKey: "wealth_builder_premium",
              billingInterval: "monthly",
              status: "paid",
              amountCents: 2900,
              createdAt: new Date().toISOString(),
              paidAt: new Date().toISOString(),
            },
          ],
        },
      }),
    });
  });

  await page.goto(`${BASE_URL}/wealth-builder/status`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector("text=Recommended next actions");
  await page.waitForSelector("text=1) Keep transactions current");

  const nextActionsVisible = await page
    .locator("text=Recommended next actions")
    .isVisible();
  const txCardVisible = await page
    .locator("text=7 recorded transactions")
    .isVisible();

  await page.screenshot({
    path: path.join(outDir, "pass-b-status-next-actions.png"),
    fullPage: true,
  });

  await page.click('a[href="/wealth-builder/transactions"]');
  await page.waitForURL("**/wealth-builder/transactions");
  await page.screenshot({
    path: path.join(outDir, "pass-b-next-action-transactions-route.png"),
    fullPage: true,
  });

  await context.close();
  return { nextActionsVisible, txCardVisible };
}

async function passCSellerFallbackProof(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.route("**/api/auth/signup", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, accountType: "seller" }),
    });
  });

  await page.goto(`${BASE_URL}/signup?type=seller`, {
    waitUntil: "domcontentloaded",
  });
  await page.fill(
    'input[name="email"]',
    `seller-proof-${Date.now()}@example.com`,
  );
  await page.fill('input[name="password"]', "StrongPass1!");
  await page.fill('input[name="confirmPassword"]', "StrongPass1!");

  await page.click('button[type="submit"]');
  await page.waitForURL("**/marketplace/become-a-seller", { timeout: 7000 });
  await page.screenshot({
    path: path.join(outDir, "pass-c-seller-signup-fallback-route.png"),
    fullPage: true,
  });

  const finalUrl = page.url();
  await context.close();
  return { finalUrl };
}

async function passCAdminResponseShapeProof(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.route("**/api/admin/get-users", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        users: [
          {
            _id: "u1",
            name: "Alicia Proof",
            email: "alicia@example.com",
            accountType: "seller",
          },
          {
            _id: "u2",
            name: "Marcus Proof",
            email: "marcus@example.com",
            accountType: "user",
          },
        ],
      }),
    });
  });

  await page.goto(`${BASE_URL}/admin/user-management`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector("text=User & Account Management");
  await page.waitForSelector("text=Alicia Proof");

  const rowVisible = await page.locator("text=Alicia Proof").isVisible();
  const noUsersVisible = await page.locator("text=No users found.").count();

  await page.screenshot({
    path: path.join(outDir, "pass-c-admin-user-shape-rendered.png"),
    fullPage: true,
  });

  await context.close();
  return { rowVisible, noUsersVisible };
}

async function main() {
  await ensureDir();

  const browser = await chromium.launch({ headless: true });
  const summary = {};

  try {
    summary.passB = await passBStatusProof(browser);
    summary.passCSeller = await passCSellerFallbackProof(browser);
    summary.passCAdmin = await passCAdminResponseShapeProof(browser);
  } finally {
    await browser.close();
  }

  const summaryPath = path.join(outDir, "summary.json");
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));

  console.log(`Runtime proof summary written to ${summaryPath}`);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
