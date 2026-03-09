# BWE Env & Promotion System

## Environment flow

local -> preview/QA -> production

## Rules

- no direct production experimentation
- critical features proven in built runtime
- centralized env helpers only (no insecure fallbacks)
- env manifests aligned across environments

## Required release proof package

- exact commit hash(es)
- changed files list
- env diff check summary
- smoke test outputs
- rollback target
- DB migration/index note

## Rollback

- redeploy previous stable commit
- rerun smoke checks
- log incident + prevention note

## Must-run commands before promotion

- `npm run lint`
- `npm run build`
- `npm run smoke:routes`
- `npm run check:critical-indexes`
- `npm run check:db-docs`
- `npm run check:p2-regression`
