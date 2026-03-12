import { chromium } from "playwright";
import fs from "node:fs";

const base = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";

const result = {
  base,
  discovered: [],
  validations: [],
  failures: [],
};

const seeds = ["/marketplace", "/marketplace/become-a-seller"];

const isBuyLabel = (label = "") => {
  const t = label.toLowerCase();
  return (
    t.includes("buy") ||
    t.includes("checkout") ||
    t.includes("add to cart") ||
    t.includes("purchase")
  );
};

async function gotoWithRetry(page, url, opts = {}, retries = 2) {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await page.goto(url, opts);
    } catch (e) {
      lastError = e;
      if (attempt < retries) {
        await page.waitForTimeout(250 * (attempt + 1));
      }
    }
  }
  throw lastError;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();

  const networkErrors = [];
  const jsErrors = [];

  page.on("response", (r) => {
    if (r.status() >= 400) {
      const url = r.url();
      if (url.includes("/marketplace") || url.includes("/api/")) {
        networkErrors.push({ status: r.status(), url });
      }
    }
  });

  page.on("pageerror", (e) => jsErrors.push(String(e)));

  // Try to discover real product details from API first.
  try {
    const apiRes = await page.request.get(
      `${base}/api/marketplace/get-products?page=1&limit=12&category=All`,
    );
    if (!apiRes.ok()) {
      result.failures.push({
        url: "/api/marketplace/get-products",
        reason: `unexpected status ${apiRes.status()}`,
      });
    } else {
      const data = await apiRes.json();
      const products = Array.isArray(data?.products) ? data.products : [];
      for (const p of products.slice(0, 5)) {
        if (p?._id) seeds.push(`/marketplace/product/${p._id}`);
      }
    }
  } catch (e) {
    result.failures.push({
      url: "/api/marketplace/get-products",
      reason: `request failed: ${String(e)}`,
    });
  }

  const visited = new Set();
  const queue = [...new Set(seeds)];

  while (queue.length && visited.size < 50) {
    const path = queue.shift();
    if (!path || visited.has(path)) continue;
    visited.add(path);

    let status = 0;
    try {
      const resp = await gotoWithRetry(page, `${base}${path}`, {
        waitUntil: "domcontentloaded",
      });
      status = resp?.status() || 0;
    } catch {
      result.failures.push({ url: path, reason: "navigation failed" });
      continue;
    }

    if (![200, 301, 302, 307, 308].includes(status)) {
      result.failures.push({
        url: path,
        reason: `unexpected status ${status}`,
      });
      continue;
    }

    await page.waitForTimeout(500);

    const controls = await page.evaluate(() => {
      const nodes = Array.from(
        document.querySelectorAll(
          "a,button,input[type='button'],input[type='submit']",
        ),
      );
      return nodes.map((el) => {
        const label = (el.textContent || el.getAttribute("value") || "").trim();
        const href = el.getAttribute("href") || el.href || "";
        return { label, href };
      });
    });

    for (const c of controls) {
      if (!c.label || !isBuyLabel(c.label)) continue;
      result.discovered.push({
        page: path,
        label: c.label,
        href: c.href || null,
      });
    }
  }

  const dedup = [];
  const seen = new Set();
  for (const d of result.discovered) {
    const k = `${d.page}::${d.label}::${d.href || ""}`;
    if (!seen.has(k)) {
      seen.add(k);
      dedup.push(d);
    }
  }

  for (const item of dedup) {
    let before = null;
    let after = null;
    let preNet = networkErrors.length;
    let preJs = jsErrors.length;

    try {
      await gotoWithRetry(page, `${base}${item.page}`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForTimeout(400);
      before = page.url();
      preNet = networkErrors.length;
      preJs = jsErrors.length;
    } catch (e) {
      const row = {
        page: item.page,
        label: item.label,
        target: item.href,
        expected: "CTA click should proceed without 404/500 or JS errors",
        actual: {
          before,
          after,
          clicked: false,
          clickError: `pre-click navigation failed: ${String(e)}`,
          networkErrors: networkErrors.slice(preNet),
          jsErrors: jsErrors.slice(preJs),
        },
        pass: false,
      };
      result.validations.push(row);
      result.failures.push(row);
      continue;
    }

    let clicked = false;
    let clickError = null;

    try {
      const locator = page.locator(`text=${item.label}`).first();
      if (await locator.count()) {
        await locator.click({ timeout: 4000 });
        clicked = true;
        await page.waitForTimeout(800);
      }
    } catch (e) {
      clickError = String(e);
    }

    after = page.url();
    const netAfter = networkErrors.slice(preNet);
    const jsAfter = jsErrors.slice(preJs);
    const pass =
      clicked &&
      !clickError &&
      jsAfter.length === 0 &&
      netAfter.every((n) => ![404, 500].includes(n.status));

    const row = {
      page: item.page,
      label: item.label,
      target: item.href,
      expected: "CTA click should proceed without 404/500 or JS errors",
      actual: {
        before,
        after,
        clicked,
        clickError,
        networkErrors: netAfter,
        jsErrors: jsAfter,
      },
      pass,
    };

    result.validations.push(row);
    if (!pass) result.failures.push(row);
  }

  await browser.close();

  fs.mkdirSync(".audit", { recursive: true });
  fs.writeFileSync(
    ".audit/buy-button-matrix.json",
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));

  if (result.failures.length) process.exit(1);
})();
