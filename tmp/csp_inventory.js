const { chromium } = require("playwright");

(async () => {
  const base = "http://localhost:3000";
  const routes = [
    "/",
    "/marketplace",
    "/job-listings",
    "/business-directory",
    "/support",
    "/pricing",
    "/travel-map",
    "/financial-literacy",
    "/checkout?plan=premium",
  ];
  const origins = {
    script: new Set(),
    style: new Set(),
    connect: new Set(),
    frame: new Set(),
    img: new Set(),
    font: new Set(),
    other: new Set(),
  };
  const inline = { script: 0, styleAttr: 0, styleTag: 0 };
  const cspHeaders = [];
  const consoleMsgs = [];

  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();

  p.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning")
      consoleMsgs.push(m.text());
  });
  p.on("response", async (r) => {
    const u = new URL(r.url());
    const rt = r.request().resourceType();
    const o = u.origin;
    if (rt === "script") origins.script.add(o);
    else if (rt === "stylesheet") origins.style.add(o);
    else if (
      rt === "xhr" ||
      rt === "fetch" ||
      rt === "websocket" ||
      rt === "eventsource"
    )
      origins.connect.add(o);
    else if (rt === "image") origins.img.add(o);
    else if (rt === "font") origins.font.add(o);
    else if (rt === "document" || rt === "iframe") origins.frame.add(o);
    else origins.other.add(o);

    if (r.url() === base + "/") {
      const csp = r.headers()["content-security-policy"];
      if (csp) cspHeaders.push(csp);
    }
  });

  for (const route of routes) {
    try {
      await p.goto(base + route, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
      await p.waitForTimeout(1800);
      const counts = await p.evaluate(() => ({
        inlineScripts: [...document.querySelectorAll("script:not([src])")]
          .length,
        styleTags: document.querySelectorAll("style").length,
        styleAttrs: document.querySelectorAll("[style]").length,
      }));
      inline.script += counts.inlineScripts;
      inline.styleTag += counts.styleTags;
      inline.styleAttr += counts.styleAttrs;
    } catch (e) {
      consoleMsgs.push(`NAV_ERR ${route} ${e.message}`);
    }
  }

  await b.close();

  function arr(s) {
    return [...s].sort();
  }
  console.log(
    JSON.stringify(
      {
        cspHeader: cspHeaders[0] || null,
        origins: {
          script: arr(origins.script),
          style: arr(origins.style),
          connect: arr(origins.connect),
          frame: arr(origins.frame),
          img: arr(origins.img),
          font: arr(origins.font),
          other: arr(origins.other),
        },
        inline,
        console: [...new Set(consoleMsgs)].slice(0, 80),
      },
      null,
      2,
    ),
  );
})();
