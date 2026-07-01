#!/usr/bin/env node
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { MongoClient } from 'mongodb';
import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const MONGO_URI = process.env.MONGODB_URI;
const SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
const DB_NAME = process.env.MONGODB_DB || process.env.MONGODB_DB_NAME || 'test';
const email = 'tjameshooker@gmail.com';

if (!MONGO_URI || !SECRET) throw new Error('Missing env');

const client = new MongoClient(MONGO_URI);
await client.connect();
const user = await client.db(DB_NAME).collection('users').findOne({ email }, { projection: { _id: 1, email: 1 } });
if (!user) throw new Error('Owner user not found');
const token = jwt.sign({ userId: String(user._id), email: user.email }, SECRET, { expiresIn: '2h' });
await client.close();

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ baseURL: BASE });
await context.addCookies([{ name: 'session_token', value: token, domain: 'localhost', path: '/' }]);
const page = await context.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e.message || e)));
const net4xx = [];
page.on('response', (r) => {
  const s = r.status();
  if (s >= 400) net4xx.push({ url: r.url(), status: s });
});

const out = {};

await page.goto('/dashboard', { waitUntil: 'networkidle' });
const dashText = await page.locator('body').innerText();
out.dashboardCtaText = dashText.includes('View My Digital Black Card') ? 'View My Digital Black Card' : (dashText.includes('Activate Black Card') ? 'Activate Black Card' : 'not found');

const viewBtn = page.getByRole('link', { name: /View My Digital Black Card/i }).first();
if (await viewBtn.count()) await viewBtn.click(); else await page.goto('/dashboard/black-card', { waitUntil: 'networkidle' });
await page.waitForLoadState('networkidle');
const cardText = await page.locator('body').innerText();
out.dashboardCardVisible = /Black Card|Member ID|Status/i.test(cardText);
out.memberIdVisible = cardText.includes('BCM-31924381');
out.statusActiveVisible = /Status\s*:?\s*Active/i.test(cardText);
out.phoneGuidanceVisible = cardText.includes('Open this page on your phone, log in, and save it to your home screen.');

const verifyResp = await page.request.get('/black-card/verify/bcv_5a59ac86be5b520d');
out.verificationLinkWorks = verifyResp.status() === 200;

await page.goto('/black-card', { waitUntil: 'networkidle' });
const bcText = await page.locator('body').innerText();
out.blackCardActiveTextVisible = bcText.includes('Your Standard Black Card is active');
out.blackCardHasRequestText = bcText.includes('Request Black Card');

await page.goto('/black-card/join', { waitUntil: 'networkidle' });
const joinText = await page.locator('body').innerText();
out.blackCardJoinActiveTextVisible = joinText.includes('Your Black Card is active');
out.blackCardJoinHasRequestCta = joinText.includes('Request Black Card') || joinText.includes('Activate Black Card');

await page.goto('/pricing', { waitUntil: 'networkidle' });
const pricingText = await page.locator('body').innerText();
out.pricingLabelsFixed = pricingText.includes('Founding Member') && !pricingText.includes('Founding Member Member') && pricingText.includes('Premium includes the Standard Black Card') && pricingText.includes('Founding Member includes the Signature Black Card');

await page.goto('/admin/black-card', { waitUntil: 'networkidle' });
const adminText = await page.locator('body').innerText();
out.adminOwnerCardVisible = adminText.includes('tjameshooker@gmail.com') && (/LIVE|Active|ACTIVE/.test(adminText));
out.adminActivateRemovedForActive = !adminText.includes('Activate card');

out.hydrationErrorGone = !errors.some(e => /hydration/i.test(e));
out.has404 = net4xx.some(x => x.status === 404);
out.consoleErrors = errors;
out.net4xx = net4xx;

console.log(JSON.stringify(out, null, 2));
await browser.close();