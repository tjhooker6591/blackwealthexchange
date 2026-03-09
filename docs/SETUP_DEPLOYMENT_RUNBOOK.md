# Setup + Deployment Runbook

## 1) Bootstrap a new local machine

1. Install Node/npm matching project baseline.
   - Verify: `node -v`, `npm -v`
2. Clone repo and install deps:
   - `npm ci`
3. Create `.env.local` from `.env.example`.
4. Run local preflight:
   - `npm run check:env:local`
5. Start app:
   - `npm run dev`

## 2) Local env setup rules

- `JWT_SECRET` and `NEXTAUTH_SECRET` are both required and must match.
- `NEXTAUTH_URL` must be local URL (`http://localhost:3000`).
- `MONGODB_URI` + `MONGODB_DB` must be set.
- If testing checkout, set Stripe keys too (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`).

## 3) Preview env management

Before deploy:

1. `npm run check:env:preview`
2. Ensure preview environment has:
   - auth secrets + callback URLs
   - Mongo vars
   - Stripe vars (if checkout is tested)
3. Deploy exact commit intended for validation.

Preview smoke checklist:

- `/` loads
- `/login` loads
- `/api/auth/session` returns 200
- one protected route (e.g. dashboard redirect/guard behavior)
- one public DB-backed route (e.g. `/marketplace` or `/business-directory`)

## 4) Production env management

Before production promotion:

1. `npm run check:env:production`
2. Confirm production variable names exactly match code expectations.
3. Confirm no value drift from approved secret source.

Production smoke checklist:

- `/` loads
- `/login` loads
- `/api/auth/session` returns expected shape
- protected dashboard access works with auth
- one public DB-backed page renders
- payment route health if applicable (no live charge in smoke)

## 5) Post-change localhost runtime gate (mandatory)

After meaningful code changes, verify localhost runtime health before marking done:

- `http://127.0.0.1:3000/`
- `http://127.0.0.1:3000/marketplace`
- `http://127.0.0.1:3000/business-directory`
- `http://127.0.0.1:3000/recruiting-consulting`
- key `_next` assets load (main/app/marketplace chunks)
- no chunk/module/white-page/runtime errors

## 6) Common failures

- **Missing JWT secret**: `.env.local` absent/incomplete or shell env mismatch.
- **500 with missing chunk/module**: stale `.next` cache or mixed processes; stop all Next processes and restart clean.
- **Checkout 500 missing Stripe key**: `STRIPE_SECRET_KEY` not in runtime env.
- **Mongo connection refused**: local Mongo URI used where managed Mongo expected.
