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
let consultantId, employerId;

try {
  await client.connect();
  const db = client.db(dbName);
  const users = db.collection('users');
  const ts = Date.now();
  const now = new Date();

  consultantId = new ObjectId();
  employerId = new ObjectId();
  const consultantEmail = `proof-consultant-${ts}@example.com`;
  const employerEmail = `proof-employer-${ts}@example.com`;

  await users.insertMany([
    { _id: consultantId, email: consultantEmail, accountType: 'user', createdAt: now, updatedAt: now },
    { _id: employerId, email: employerEmail, accountType: 'employer', createdAt: now, updatedAt: now },
  ]);

  const consultantToken = jwt.sign({ userId: String(consultantId), id: String(consultantId), email: consultantEmail, accountType: 'user' }, secret, { expiresIn: '1h' });
  const employerToken = jwt.sign({ userId: String(employerId), id: String(employerId), email: employerEmail, accountType: 'employer' }, secret, { expiresIn: '1h' });

  const consultantCookie = `session_token=${consultantToken}; accountType=user`;
  const employerCookie = `session_token=${employerToken}; accountType=employer`;

  const patchBody = {
    professionalTitle: 'Senior QA Consultant',
    category: 'QA / Testing',
    topSkills: ['Selenium', 'Jira', 'SQL'],
    yearsExperience: 8,
    availability: 'Part-time',
    engagementType: 'Contract',
    industriesServed: ['Finance'],
    summary: 'Quality and automation consultant',
    toolsPlatforms: ['Selenium', 'Playwright'],
    projectHistory: ['Automation modernization'],
  };

  const checks = [];
  checks.push({ name: 'consultant_get_anon_unauthorized', expect: 401, ...(await req('/api/consultants/profile')) });
  checks.push({ name: 'consultant_patch_user_ok', expect: 200, ...(await req('/api/consultants/profile', { method: 'PATCH', cookie: consultantCookie, body: patchBody })) });
  checks.push({ name: 'consultant_get_user_ok', expect: 200, ...(await req('/api/consultants/profile', { cookie: consultantCookie })) });
  checks.push({ name: 'consultant_patch_employer_forbidden', expect: 403, ...(await req('/api/consultants/profile', { method: 'PATCH', cookie: employerCookie, body: patchBody })) });

  const passed = checks.filter(c => c.status === c.expect).length;
  console.log(JSON.stringify({
    baseUrl,
    totals: { total: checks.length, passed, failed: checks.length - passed },
    checks: checks.map(c => ({ name: c.name, expect: c.expect, status: c.status, pass: c.status === c.expect })),
  }, null, 2));

  if (passed !== checks.length) process.exitCode = 1;
} finally {
  try {
    const db = client.db(dbName);
    if (consultantId) {
      await db.collection('consultant_profiles').deleteMany({ userId: String(consultantId) });
      await db.collection('users').deleteOne({ _id: consultantId });
      await db.collection('users').deleteOne({ _id: employerId });
    }
  } catch {}
  await client.close().catch(() => {});
}
