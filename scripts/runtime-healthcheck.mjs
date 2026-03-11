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

const css = html.match(/\/_next\/static\/css\/[^"']+\.css/)?.[0];
if (!css) {
  console.log(
    "WARN css asset not found in homepage HTML (expected in some dev renders)",
  );
} else {
  const cssRes = await fetch(`${base}${css}`);
  const ok = cssRes.status >= 200 && cssRes.status < 300;
  console.log(`${ok ? "OK" : "FAIL"} ${css} -> ${cssRes.status}`);
  if (!ok) failed = true;
}

const jsAssets = [
  ...html.matchAll(/src="(\/_next\/static\/chunks\/[^"']+\.js)"/g),
].map((m) => m[1]);
if (!jsAssets.length) {
  console.log("FAIL no JS chunk assets found in homepage HTML");
  failed = true;
} else {
  const js = jsAssets[0];
  const jsRes = await fetch(`${base}${js}`);
  const ok = jsRes.status >= 200 && jsRes.status < 300;
  console.log(`${ok ? "OK" : "FAIL"} ${js} -> ${jsRes.status}`);
  if (!ok) failed = true;
}

if (failed) process.exit(1);
