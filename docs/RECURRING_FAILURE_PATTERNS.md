# Recurring Failure Patterns (and Safe Recovery)

## 1) Local runtime returns 500 on many routes
**Symptom**
- `/` and multiple pages return 500 while process still listens on :3000.

**Likely cause**
- Stale/corrupted `.next` artifacts or unstable dev process state.

**Safe recovery**
1. Stop current process on :3000.
2. Remove `.next` manually.
3. Restart `npm run dev`.
4. Re-run `npm run check:runtime-health` and `npm run smoke:local`.

## 2) Environment drift across machines
**Symptom**
- Auth/reset/checkout features fail only on specific machine.

**Likely cause**
- Missing/mismatched env values (`NEXTAUTH_*`, `MONGODB_*`, Stripe keys).

**Safe recovery**
- Run `npm run check:env:local` and fix missing/warned variables.

## 3) Buy-flow false negatives in automation
**Symptom**
- Test claims CTA failure while manual navigation works.

**Likely cause**
- Text-only locator collisions/flaky click target resolution.

**Safe mitigation**
- Prefer href-specific locators where target link is known.
- Keep fallback text locators for non-link CTAs.

## 4) Sponsor images silently fallback to placeholder
**Symptom**
- House sponsors display generic draft image unexpectedly.

**Likely cause**
- Missing sponsor-specific files under `public/images`.

**Safe recovery**
- Run `set -a && source .env.local && set +a && node scripts/seed-house-sponsors-safe.mjs`
- Review output `usedFallback` list and add missing assets.

## 5) Reset routes appear successful but no email arrives
**Symptom**
- API returns 200 generic success but inbox receives nothing.

**Likely cause**
- Dev json transport fallback or missing SMTP credentials.

**Safe interpretation**
- App logic can still be healthy (token creation + DB write).
- Treat external email delivery as separate dependency from route correctness.
