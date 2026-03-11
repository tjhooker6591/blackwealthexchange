import { chromium } from "playwright";
import fs from "node:fs";

const base = "http://127.0.0.1:3000";
const email = process.env.PROOF_EMAIL;
const password = process.env.PROOF_PASSWORD;
if (!email || !password) {
  console.error("Missing PROOF_EMAIL/PROOF_PASSWORD");
  process.exit(1);
}

const out = { base, email, steps: [], screenshots: [] };
const shotDir = ".audit/proof-shots";
fs.mkdirSync(shotDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
});
const page = await context.newPage();

async function shot(name) {
  const path = `${shotDir}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  out.screenshots.push(path);
}

try {
  // 1) Login proof
  await page.goto(`${base}/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  await page.click(
    'button:has-text("Login"), button:has-text("Sign In"), button[type="submit"]',
  );
  await page.waitForTimeout(1500);
  await shot("login-after-submit");

  const meResp = await context.request.get(`${base}/api/auth/me`, {
    headers: {
      cookie: (await context.cookies())
        .map((c) => `${c.name}=${c.value}`)
        .join("; "),
    },
  });
  const sessionResp = await context.request.get(`${base}/api/auth/session`, {
    headers: {
      cookie: (await context.cookies())
        .map((c) => `${c.name}=${c.value}`)
        .join("; "),
    },
  });
  out.steps.push({
    flow: "login",
    currentUrl: page.url(),
    meStatus: meResp.status(),
    sessionStatus: sessionResp.status(),
    meBody: await meResp.text(),
    sessionBody: await sessionResp.text(),
  });

  // 2) Marketplace image UI proof
  await page.goto(`${base}/marketplace`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const imageProof = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll("img"));
    const productLinks = Array.from(
      document.querySelectorAll('a[href^="/marketplace/product/"]'),
    );
    const loadedImgs = imgs.filter(
      (i) => i.complete && (i.naturalWidth || 0) > 0,
    );
    return {
      totalImgs: imgs.length,
      loadedImgs: loadedImgs.length,
      productCardLinks: productLinks.length,
      sample: imgs.slice(0, 6).map((i) => ({
        src: i.getAttribute("src"),
        w: i.naturalWidth,
        h: i.naturalHeight,
      })),
    };
  });
  await shot("marketplace-images");
  out.steps.push({ flow: "marketplace-images", ...imageProof });

  // 3) Pricing flow proof
  await page.goto(`${base}/pricing`, { waitUntil: "domcontentloaded" });
  const startPricing = page.url();
  await page.click('button:has-text("Upgrade to Premium")');
  await page.waitForTimeout(700);
  const afterPricingCta = page.url();
  await shot("pricing-after-cta");

  let stripeReachedFromPricing = false;
  if (afterPricingCta.includes("/checkout?plan=premium")) {
    await page.click('button:has-text("Continue to Secure Checkout")');
    await page.waitForTimeout(2000);
    stripeReachedFromPricing = page.url().includes("checkout.stripe.com");
  }
  await shot("pricing-after-checkout-click");
  out.steps.push({
    flow: "pricing",
    startUrl: startPricing,
    afterCtaUrl: afterPricingCta,
    finalUrl: page.url(),
    stripeReached: stripeReachedFromPricing,
  });

  // 4) Financial literacy flow proof
  await page.goto(`${base}/financial-literacy`, {
    waitUntil: "domcontentloaded",
  });
  const flStart = page.url();
  await page.waitForTimeout(1800);
  // click actionable buy CTA in sticky purchase card
  await page.locator('button:has-text("Get Lifetime Access")').last().click();
  await page.waitForTimeout(2500);
  const flAfterGet = page.url();

  // navigate back for bottom enroll CTA proof
  await page.goto(`${base}/financial-literacy`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(1800);
  await page.click('div.fixed button:has-text("Enroll Now")');
  await page.waitForTimeout(2500);
  const flAfterEnroll = page.url();
  await shot("financial-literacy-after-ctas");

  out.steps.push({
    flow: "financial-literacy",
    startUrl: flStart,
    afterGetLifetimeAccessUrl: flAfterGet,
    afterEnrollUrl: flAfterEnroll,
    getLifetimeReachedStripe: flAfterGet.includes("checkout.stripe.com"),
    enrollReachedStripe: flAfterEnroll.includes("checkout.stripe.com"),
  });

  // 5) Become a seller continuation proof
  await page.goto(`${base}/marketplace/become-a-seller`, {
    waitUntil: "domcontentloaded",
  });
  await page.fill('input[placeholder="Business name"]', "Proof Store");
  await page.fill('input[placeholder="Business email"]', email);
  await page.fill('input[placeholder="Business phone"]', "555-111-2222");
  await page.fill('input[placeholder="Business address"]', "123 Proof St");
  await page.fill(
    'input[placeholder="Website (optional)"]',
    "https://example.com",
  );
  await page.fill(
    'textarea[placeholder="Tell buyers about your business"]',
    "Flow proof seller onboarding test",
  );
  await page.check('input[type="checkbox"]');
  await page.click('button:has-text("Create Seller Profile")');
  await page.waitForTimeout(2500);
  const sellerUrl = page.url();
  const sellerText = await page.textContent("body");
  await shot("become-seller-after-submit");

  out.steps.push({
    flow: "become-seller",
    finalUrl: sellerUrl,
    reachedStripe:
      sellerUrl.includes("connect.stripe.com") ||
      sellerUrl.includes("stripe.com"),
    continuationVisible:
      (sellerText || "").includes("Complete Payout Setup") ||
      (sellerText || "").includes("You’re All Set") ||
      sellerUrl.includes("stripe.com"),
  });

  fs.mkdirSync(".audit", { recursive: true });
  fs.writeFileSync(".audit/flow-proof.json", JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
} finally {
  await browser.close();
}
