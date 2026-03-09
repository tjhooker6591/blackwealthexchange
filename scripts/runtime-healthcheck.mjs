const base = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";

const checks = [
  "/",
  "/business-directory",
  "/recruiting-consulting",
  "/api/auth/session",
];

let failed = false;

for (const path of checks) {
  const res = await fetch(`${base}${path}`, { redirect: "manual" });
  const ok = res.status >= 200 && res.status < 300;
  console.log(`${ok ? "OK" : "FAIL"} ${path} -> ${res.status}`);
  if (!ok) failed = true;
}

const html = await fetch(`${base}/`).then((r) => r.text());
const js = html.match(/\/_next\/static\/chunks\/main[^"']*\.js/)?.[0];
if (!js) {
  console.log("FAIL main JS asset not found in homepage HTML");
  failed = true;
} else {
  const jsRes = await fetch(`${base}${js}`);
  const ok = jsRes.status >= 200 && jsRes.status < 300;
  console.log(`${ok ? "OK" : "FAIL"} ${js} -> ${jsRes.status}`);
  if (!ok) failed = true;
}

if (failed) process.exit(1);
