#!/usr/bin/env node

const BASE = process.env.APP_URL || process.argv[2] || "http://localhost:3000";

async function call(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, init);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text.slice(0, 400);
  }
  return {
    status: res.status,
    setCookie: res.headers.get("set-cookie"),
    cacheControl: res.headers.get("cache-control"),
    location: res.headers.get("location"),
    body: json,
  };
}

const output = {
  base: BASE,
  timestamp: new Date().toISOString(),
  session: await call("/api/auth/session"),
  me: await call("/api/auth/me"),
  logout: await call("/api/auth/logout", { method: "POST" }),
};

console.log(JSON.stringify(output, null, 2));
