# Machine Parity Report — 2026-03-09

## Scope

Portability audit between:

1. Blackforge Mac mini (current execution host)
2. Main dev machine (reported failure: missing JWT secret)

## Findings (confirmed)

### Mac mini baseline

- Node: `v22.22.0`
- npm: `10.9.4`
- OS: macOS `26.2` (Darwin `25.2.0`, arm64)
- Repo path in use: `/Users/blackforge/workspace/bwe/repos/repo_clean`

### Runtime-affecting portability gaps identified

1. **Env contract drift**
   - App requires auth secrets (`JWT_SECRET`/`NEXTAUTH_SECRET`) but missing/implicit values on other machine can break auth routes.
2. **Secret naming ambiguity**
   - Prior behavior tolerated partial config in some flows; now standardized in env preflight + docs.
3. **Process/env mismatch risk**
   - Different local processes/ports can run with different env exports and produce false pass/fail.
4. **Uncaptured shell exports risk**
   - Values exported in one shell session are not portable unless placed in `.env.local` (or deployment env config).

## Actions completed

- Added strict env preflight checker (`scripts/check-env.mjs`).
- Added npm scripts for local/preview/prod env verification.
- Added startup hooks (`predev`, `prebuild`, `prestart`) for early clear failure.
- Expanded `.env.example` to complete environment contract.
- Added env matrix + runbook docs.

## Main dev machine parity checklist (run there)

```bash
node -v
npm -v
npm ci
cp .env.example .env.local
# fill required values
npm run check:env:local
npm run dev
```

Expected preflight pass conditions:

- `JWT_SECRET` set
- `NEXTAUTH_SECRET` set and matches `JWT_SECRET`
- `NEXTAUTH_URL` set
- `MONGODB_URI` and `MONGODB_DB` set

## Proof status

- Mac mini startup: validated.
- Main dev machine startup: **pending direct execution proof from that machine** (requires running checklist above on main dev host and sharing output).
