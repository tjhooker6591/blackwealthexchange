import process from "node:process";

const base = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";

const stamp = Date.now();

const checks = [
  ["GET", "/"],
  ["GET", "/business-directory"],
  ["GET", "/recruiting-consulting"],
  ["GET", "/api/auth/session"],
  ["GET", "/api/searchBusinesses?query=food&limit=3"],
  ["GET", "/api/searchOrganizations?query=church&limit=3"],
  [
    "POST",
    "/api/auth/request-reset",
    { email: `smoke-reset-${stamp}@example.com` },
  ],
  [
    "POST",
    "/api/consulting-intake",
    {
      type: "employer",
      name: "Smoke QA",
      email: `smoke-qa-${stamp}@example.com`,
      details: "smoke test",
    },
  ],
];

let failed = false;

for (const [method, path, body] of checks) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const ok = res.status >= 200 && res.status < 300;
  console.log(`${ok ? "OK" : "FAIL"} ${method} ${path} -> ${res.status}`);
  if (!ok) failed = true;
}

if (failed) process.exit(1);
