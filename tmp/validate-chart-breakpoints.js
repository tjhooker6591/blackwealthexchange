const { chromium } = require("playwright");

(async () => {
  const widths = [320, 390, 430, 768, 1280];
  const browser = await chromium.launch({ headless: true });

  for (const w of widths) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: 1200 },
    });
    const page = await ctx.newPage();
    await page.goto("http://127.0.0.1:3000", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    const metrics = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
      bw: document.body.scrollWidth,
    }));

    await page.screenshot({ path: `tmp/chart-${w}.png`, fullPage: true });
    console.log(
      JSON.stringify({
        w,
        ...metrics,
        overflow: metrics.sw > metrics.cw || metrics.bw > metrics.cw,
      }),
    );
    await ctx.close();
  }

  await browser.close();
})();
