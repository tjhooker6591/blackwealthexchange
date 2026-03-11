# Production Readiness Checklist (Env + Smoke)

## Environment required

- [ ] `JWT_SECRET` set
- [ ] `NEXTAUTH_SECRET` set
- [ ] `JWT_SECRET === NEXTAUTH_SECRET`
- [ ] `NEXTAUTH_URL` set to production URL
- [ ] `APP_URL` set to production URL (https)
- [ ] `NEXT_PUBLIC_APP_URL` set to production URL (https)
- [ ] `MONGODB_URI` set (non-localhost)
- [ ] `MONGODB_DB` set
- [ ] Stripe vars set if payments enabled:
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - [ ] `STRIPE_WEBHOOK_SECRET`

## Validation gates

- [ ] `npm run check:env:production`
- [ ] Preview smoke pass on exact commit hash
- [ ] Rollback SHA recorded

## Post-deploy smoke

- [ ] `/` returns 200 and renders
- [ ] `/login` returns 200 and renders
- [ ] `/api/auth/session` healthy
- [ ] protected dashboard route auth behavior correct
- [ ] one public DB-backed page renders (`/business-directory` or `/marketplace`)
- [ ] payment route health check (non-destructive)
