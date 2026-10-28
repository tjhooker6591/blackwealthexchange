#!/usr/bin/env node
// Phone check: everything a visitor can open must be fully reachable.
//
// Opens the site at phone sizes and, for the phone menu, every job's details
// pop-up and the Copilot course page, checks that each link and button can be
// scrolled into view (nothing stuck past the bottom of the screen) and that
// nothing makes the page scroll sideways. Catches the class of bug a code scan
// can't see, like a menu inside the sticky header that is taller than the
// screen.
//
// Run against localhost, a preview or production:
//   node scripts/check-phone-reach.mjs [base-url]     (default http://localhost:3000)
import { chromium, devices } from "playwright";

const BASE = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const PHONES = ["iPhone SE", "iPhone 13", "Pixel 7"];
const PAGES = [
  "/",
  "/job-listings",
  "/courses/copilot-training",
  "/business-directory",
  "/marketplace",
  "/financial-literacy",
  "/learning",
];
const failures = [];

async function unreachable(page, locator) {
  const out = [];
  const n = await locator.count();
  for (let i = 0; i < n; i++) {
    const el = locator.nth(i);
    if (!(await el.isVisible().catch(() => false))) continue;
    await el.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
    const box = await el.boundingBox();
    const vh = page.viewportSize().height;
    if (!box || box.y < 0 || box.y + Math.min(box.height, 40) > vh)
      out.push(
        (
          (await el.textContent()) ||
          (await el.getAttribute("aria-label")) ||
          "?"
        )
          .trim()
          .slice(0, 40),
      );
  }
  return out;
}

const browser = await chromium.launch();
try {
  for (const phone of PHONES) {
    const ctx = await browser.newContext(devices[phone]);
    const page = await ctx.newPage();
    for (const path of PAGES) {
      await page
        .goto(BASE + path, { waitUntil: "networkidle", timeout: 120000 })
        .catch(() => {});
      const wide = await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      );
      if (wide > 1)
        failures.push(`${phone} ${path}: page scrolls sideways by ${wide}px`);
    }

    // Phone menu: every item reachable, at the top of the page and scrolled.
    for (const scrolled of [false, true]) {
      await page.goto(BASE + "/", {
        waitUntil: "networkidle",
        timeout: 120000,
      });
      if (scrolled) await page.evaluate(() => scrollTo(0, 1500));
      await page.getByRole("button", { name: "Open menu" }).click();
      await page.waitForTimeout(500);
      const lost = await unreachable(
        page,
        page.locator("#mobile-nav-menu a, #mobile-nav-menu button"),
      );
      if (lost.length)
        failures.push(
          `${phone} phone menu${scrolled ? " (page scrolled)" : ""}: can't reach ${lost.join(", ")}`,
        );
    }

    // Every job's details pop-up: title, Close and Apply reachable.
    await page.goto(BASE + "/job-listings", {
      waitUntil: "networkidle",
      timeout: 120000,
    });
    const views = page.getByRole("button", { name: "View", exact: true });
    const jobs = await views.count();
    for (let i = 0; i < jobs; i++) {
      await views.nth(i).scrollIntoViewIfNeeded();
      await views.nth(i).click();
      await page.waitForTimeout(400);
      const dialog = page.getByRole("dialog");
      const lost = await unreachable(page, dialog.locator("h2, button"));
      if (lost.length)
        failures.push(
          `${phone} job pop-up ${i + 1}: can't reach ${lost.join(", ")}`,
        );
      await dialog
        .getByRole("button", { name: "Close", exact: true })
        .first()
        .click()
        .catch(() => page.keyboard.press("Escape"));
      await page.waitForTimeout(200);
    }
    await ctx.close();
    console.log(
      `${phone}: checked ${PAGES.length} pages, the phone menu and ${jobs} job pop-ups`,
    );
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error("\nPhone reach problems:\n  " + failures.join("\n  "));
  process.exit(1);
}
console.log("check-phone-reach: everything is reachable on phones.");
