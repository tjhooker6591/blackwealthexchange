# ENV_VARS

This project now uses centralized env access via `src/lib/env.ts` for auth/mongo-critical paths.

## Required (all environments)

- `JWT_SECRET` **or** `NEXTAUTH_SECRET` (recommended: set both to the same value)
- `MONGODB_URI`

## Required for NextAuth behavior

- `NEXTAUTH_SECRET` (or matching `JWT_SECRET` fallback)
- `NEXTAUTH_URL`

## Recommended

- `MONGODB_DB` (defaults to `bwes-cluster` if omitted)
- `NEXT_PUBLIC_BASE_URL`
- `APP_URL` (server absolute URL for reset links; local: `http://localhost:3000`)
- `NEXT_PUBLIC_APP_URL` (fallback for reset-link generation if `APP_URL` is missing)
- `RESET_TOKEN_SECRET` (optional dedicated reset secret; falls back to JWT secret)
- `RESET_DEBUG_MODE=1` (local-only debug hook to return reset token/link in API response for e2e verification; never enable in production)

## Stripe (when using payment flows)

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

## Environment separation rules

### Local

- `MONGODB_URI` can point to local Mongo.
- Example: `mongodb://127.0.0.1:27017`

### Preview / Production

- `MONGODB_URI` must **not** point to localhost.
- Use a managed/remote Mongo endpoint.
- Keep `JWT_SECRET` and `NEXTAUTH_SECRET` aligned if both are set.

## Safety rules

- Do not commit real secrets.
- Do not use `dev-secret` / `default_secret` in production code paths.
- Missing required env vars should fail clearly.
