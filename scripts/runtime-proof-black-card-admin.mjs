#!/usr/bin/env node
import "dotenv/config";
import jwt from "jsonwebtoken";

const BASE = process.env.APP_URL || "http://localhost:3000";
const SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
if (!SECRET) throw new Error("Missing JWT secret");

const token = jwt.sign(
  { userId: "admin-proof-user", email: "admin-proof@bwe.local", role: "admin", isAdmin: true },
  SECRET,
  { expiresIn: "1h" },
);
const cookie = `session_token=${token}`;

async function call(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
      ...(options.headers || {}),
    },
  });
  const txt = await res.text();
  let json;
  try { json = JSON.parse(txt); } catch { json = txt; }
  return { status: res.status, json };
}

const list = await call('/api/admin/black-card/redemptions?status=pending');
const firstId = Array.isArray(list.json?.items) && list.json.items.length ? list.json.items[0].id : null;

const out = { list };
if (firstId) {
  out.approve = await call('/api/admin/black-card/redemptions', {
    method: 'PATCH',
    body: JSON.stringify({ redemptionId: firstId, status: 'approved' }),
  });
  out.fulfill = await call('/api/admin/black-card/redemptions', {
    method: 'PATCH',
    body: JSON.stringify({ redemptionId: firstId, status: 'fulfilled' }),
  });
}

console.log(JSON.stringify(out, null, 2));
