const { chromium } = require("playwright");

(async () => {
  const base = "http://localhost:3000";
  const routes = [
    "/",
    "/business-directory",
    "/marketplace",
    "/job-listings",
    "/login",
    "/signup",
    "/api/auth/me",
    "/dashboard/employer/consultants",
    "/business-dashboard",
    "/wealth-builder",
    "/wealth-builder/dashboard",
    "/travel-map",
    "/checkout",
    "/payment/success",
    "/payment/cancel",
    "/advertising/checkout",
  ];

  const originsByType = {
    script: new Set(),
    connect: new Set(),
    frame: new Set(),
    style: new Set(),
    img: new Set(),
    font: new Set(),
  };
  const originsByRoute = {};
  const inlineByRoute = {};
  const statuses = {};
  let cspHeader = null;

  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();

  p.on("response", (r) => {
    try {
      const u = new URL(r.url());
      const rt = r.request().resourceType();
      const o = u.origin;
      if (rt === "script") originsByType.script.add(o);
      else if (
        rt === "xhr" ||
        rt === "fetch" ||
        rt === "websocket" ||
        rt === "eventsource"
      )
        originsByType.connect.add(o);
      else if (rt === "document" || rt === "iframe") originsByType.frame.add(o);
      else if (rt === "stylesheet") originsByType.style.add(o);
      else if (rt === "image") originsByType.img.add(o);
      else if (rt === "font") originsByType.font.add(o);
    } catch {}
  });

  for (const route of routes) {
    const routeOrigins = {
      script: new Set(),
      connect: new Set(),
      frame: new Set(),
      style: new Set(),
      img: new Set(),
      font: new Set(),
    };
    const handler = (req) => {};
    const respHandler = (r) => {
      try {
        const u = new URL(r.url());
        const rt = r.request().resourceType();
        const o = u.origin;
        if (rt === "script") routeOrigins.script.add(o);
        else if (
          rt === "xhr" ||
          rt === "fetch" ||
          rt === "websocket" ||
          rt === "eventsource"
        )
          routeOrigins.connect.add(o);
        else if (rt === "document" || rt === "iframe")
          routeOrigins.frame.add(o);
        else if (rt === "stylesheet") routeOrigins.style.add(o);
        else if (rt === "image") routeOrigins.img.add(o);
        else if (rt === "font") routeOrigins.font.add(o);
      } catch {}
    };
    p.on("response", respHandler);
    try {
      const res = await p.goto(base + route, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
      statuses[route] = res ? res.status() : null;
      if (route === "/" && res) {
        cspHeader = (await res.allHeaders())["content-security-policy"] || null;
      }
      await p.waitForTimeout(1800);
      inlineByRoute[route] = await p.evaluate(() => ({
        inlineScripts: document.querySelectorAll("script:not([src])").length,
        styleTags: document.querySelectorAll("style").length,
        styleAttrs: document.querySelectorAll("[style]").length,
      }));
    } catch (e) {
      statuses[route] = `ERR: ${e.message}`;
      inlineByRoute[route] = null;
    }
    p.off("response", respHandler);
    originsByRoute[route] = Object.fromEntries(
      Object.entries(routeOrigins).map(([k, v]) => [k, [...v].sort()]),
    );
  }

  await b.close();
  const sortSet = (s) => [...s].sort();
  console.log(
    JSON.stringify(
      {
        cspHeader,
        statuses,
        originsByType: Object.fromEntries(
          Object.entries(originsByType).map(([k, v]) => [k, sortSet(v)]),
        ),
        originsByRoute,
        inlineByRoute,
      },
      null,
      2,
    ),
  );
})();
