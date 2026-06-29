#!/usr/bin/env node
import fs from "node:fs";
import { chromium } from "playwright";

const base = process.env.BASE_URL || "http://127.0.0.1:3000";
const outDir = ".audit/founding-membership-browser";
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
const page = await context.newPage();

const result = {
  base,
  routes: {},
  tests: {},
  errors: [],
};

async function shot(name) {
  const path = `${outDir}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  return path;
}

async function textPresent(text) {
  return page.locator(`text=${text}`).first().isVisible().catch(() => false);
}

try {
  const optionsRes = await fetch(`${base}/api/founding-membership/options`);
  const options = await optionsRes.json();
  const businesses = Array.isArray(options?.businesses) ? options.businesses : [];
  const claimable = businesses.find((b) => b?.claimable);

  result.api = {
    optionsStatus: optionsRes.status,
    businessCount: businesses.length,
    selectedClaimableId: claimable?.id || null,
    selectedClaimableName: claimable?.businessName || null,
  };

  await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
  result.routes.home = { url: page.url(), status: "loaded", screenshot: await shot("home") };

  await page.goto(`${base}/business-directory?mode=claim`, { waitUntil: "networkidle" });
  await page.waitForSelector('text=Find the business you want to claim');
  result.tests.homepageClaimMode = {
    finalUrl: page.url(),
    headingVisible: await textPresent("Find the business you want to claim"),
    instructionVisible: await textPresent("Search for your existing BWE listing, select it, and continue to the Founding Membership process."),
    listBusinessVisible: await textPresent("Don’t see your business? List it here."),
    screenshot: await shot("claim-mode-directory"),
  };

  await page.goto(`${base}/founding-membership`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  const selectedBadgesWithoutId = await page.locator('span:has-text("Selected")').count();
  const checkoutDisabledWithoutId = await page.locator('button:has-text("Start Membership and Claim Process")').isDisabled();
  result.tests.noAutoSelection = {
    url: page.url(),
    selectedBadges: selectedBadgesWithoutId,
    checkoutDisabled: checkoutDisabledWithoutId,
    screenshot: await shot("founding-membership-no-id"),
  };

  if (claimable?.businessName) {
    await page.locator(`text=${claimable.businessName}`).first().click();
    await page.waitForTimeout(300);
    const continueVisible = await page.locator('button:has-text("Continue With This Business")').isVisible();
    result.tests.manualSelection = {
      chosenBusiness: claimable.businessName,
      continueVisible,
      screenshot: await shot("manual-selection"),
    };

    await page.click('button:has-text("Continue With This Business")');
    await page.waitForTimeout(700);
    const confirmedText = await textPresent("This business is confirmed for the next step.");
    const reviewText = await textPresent("Start membership and claim process");
    const checkoutEnabledAfterConfirm = await page.locator('button:has-text("Start Membership and Claim Process")').isEnabled();
    result.tests.confirmationFlow = {
      chosenBusiness: claimable.businessName,
      finalUrl: page.url(),
      confirmedText,
      reviewText,
      checkoutEnabledAfterConfirm,
      screenshot: await shot("confirmation-flow"),
    };

    await page.goto(`${base}/founding-membership?businessId=${encodeURIComponent(claimable.id)}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    const routedSelectedCount = await page.locator('span:has-text("Selected")').count();
    const routedBusinessVisible = await textPresent(claimable.businessName);
    const routedCheckoutDisabled = await page.locator('button:has-text("Start Membership and Claim Process")').isDisabled();
    result.tests.validBusinessIdRoute = {
      businessId: claimable.id,
      businessName: claimable.businessName,
      selectedBadges: routedSelectedCount,
      businessVisible: routedBusinessVisible,
      checkoutDisabledUntilConfirm: routedCheckoutDisabled,
      screenshot: await shot("founding-membership-with-id"),
    };
  }

  const detailUrl = businesses[0]?.slug ? `${base}/business/${encodeURIComponent(businesses[0].slug)}` : null;
  if (detailUrl) {
    await page.goto(detailUrl, { waitUntil: "domcontentloaded" });
    const claimHref = await page.locator('a:has-text("Claim This Business")').first().getAttribute('href').catch(() => null);
    result.routes.businessDetail = {
      url: page.url(),
      claimHref,
      screenshot: await shot("business-detail"),
    };
  }

  await page.goto(`${base}/founding-membership/status`, { waitUntil: "domcontentloaded" });
  result.routes.memberStatus = { url: page.url(), screenshot: await shot("member-status") };

  await page.goto(`${base}/admin/founding-memberships`, { waitUntil: "domcontentloaded" });
  result.routes.adminMemberships = { url: page.url(), screenshot: await shot("admin-memberships") };

  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  result.errors.push(String(error?.stack || error));
  console.log(JSON.stringify(result, null, 2));
  process.exit(1);
} finally {
  await browser.close();
}
