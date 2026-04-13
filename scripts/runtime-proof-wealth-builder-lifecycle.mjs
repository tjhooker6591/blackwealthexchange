#!/usr/bin/env node
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { MongoClient, ObjectId } from 'mongodb';

dotenv.config({ path: '.env.local' });

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

if (!mongoUri || !dbName || !secret) {
  console.error('Missing MONGODB_URI/MONGODB_DB/JWT_SECRET|NEXTAUTH_SECRET');
  process.exit(1);
}

async function req(path, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json };
}

const client = new MongoClient(mongoUri);
let userId;
let txId;

try {
  await client.connect();
  const db = client.db(dbName);
  const users = db.collection('users');

  userId = new ObjectId();
  const ts = Date.now();
  const email = `proof-wb-${ts}@example.com`;
  const now = new Date();

  await users.insertOne({ _id: userId, email, accountType: 'user', fullName: 'Proof WB User', createdAt: now, updatedAt: now });

  const token = jwt.sign({ userId: String(userId), email, accountType: 'user' }, secret, { expiresIn: '1h' });
  const cookie = `session_token=${token}; accountType=user`;

  const checks = [];
  checks.push({ name: 'transactions_anon_unauthorized', expect: 401, ...(await req('/api/wealth-builder/transactions')) });

  const create = await req('/api/wealth-builder/transactions', {
    method: 'POST',
    cookie,
    body: { amount: 44.5, category: 'Food', merchant: 'Proof Cafe', type: 'expense', source: 'manual', notes: 'proof lifecycle' },
  });
  checks.push({ name: 'transactions_create_auth', expect: 201, ...create });
  txId = create.json?.item?.id;

  checks.push({ name: 'transactions_list_auth', expect: 200, ...(await req('/api/wealth-builder/transactions?limit=5', { cookie })) });

  if (txId) {
    checks.push({ name: 'transactions_patch_auth', expect: 200, ...(await req(`/api/wealth-builder/transactions/${txId}`, { method: 'PATCH', cookie, body: { amount: 55.25, notes: 'proof lifecycle updated' } })) });
    checks.push({ name: 'transactions_delete_auth', expect: 200, ...(await req(`/api/wealth-builder/transactions/${txId}`, { method: 'DELETE', cookie })) });
  }

  const passed = checks.filter((c) => c.status === c.expect).length;
  console.log(JSON.stringify({
    baseUrl,
    totals: { total: checks.length, passed, failed: checks.length - passed },
    checks: checks.map((c) => ({ name: c.name, expect: c.expect, status: c.status, pass: c.status === c.expect })),
  }, null, 2));

  if (passed !== checks.length) process.exitCode = 1;
} finally {
  try {
    const db = client.db(dbName);
    if (userId) {
      await db.collection('financial_transactions').deleteMany({ userId: String(userId) });
      await db.collection('users').deleteOne({ _id: userId });
    }
  } catch {}
  await client.close().catch(() => {});
}
