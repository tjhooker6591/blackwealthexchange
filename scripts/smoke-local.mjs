#!/usr/bin/env node
import http from "node:http";

const base = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";

const checks = [
  ["GET /", "/", [200]],
  ["GET /start-here", "/start-here", [200]],
  ["GET /business-directory", "/business-directory", [200]],
  ["GET /recruiting-consulting", "/recruiting-consulting", [200]],
  ["GET /marketplace", "/marketplace", [200]],
  ["GET /marketplace/become-a-seller", "/marketplace/become-a-seller", [200]],
  ["GET /api/auth/session", "/api/auth/session", [200]],
  ["POST /api/auth/request-reset", "/api/auth/request-reset", [200], "POST", { email: "nobody@example.com" }],
  ["POST /api/auth/forgot-password", "/api/auth/forgot-password", [200], "POST", { email: "nobody@example.com" }],
];

function request(path, method = "GET", body) {
  const url = new URL(path, base);
  const payload = body ? JSON.stringify(body) : null;

  return new Promise((resolve, reject) => {
    const req = http.request(
      url,
      {
        method,
        headers: payload
          ? {
              "content-type": "application/json",
              "content-length": Buffer.byteLength(payload),
            }
          : undefined,
      },
      (res) => {
        const chunks = [];
        res.on("data", (d) => chunks.push(d));
        res.on("end", () => {
          resolve({
            status: res.statusCode || 0,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

let failed = 0;
console.log(`\nLocal smoke (detect-only) against ${base}`);
for (const [name, path, expect, method, body] of checks) {
  try {
    const r = await request(path, method, body);
    const pass = expect.includes(r.status);
    if (!pass) failed += 1;
    console.log(`${pass ? "✅" : "❌"} ${name} -> ${r.status} (expect ${expect.join("/")})`);
  } catch (e) {
    failed += 1;
    console.log(`❌ ${name} -> request error: ${String(e)}`);
  }
}

if (failed) {
  console.error(`\nLocal smoke failed: ${failed} checks.`);
  process.exit(1);
}

console.log("\nLocal smoke passed.");
