# BWE-13 Second-Machine Parity Procedure

Last updated: 2026-08-25
Canonical repo: `/Users/blackforge/workspace/bwe/repos/repo_clean`
Canonical branch: `friday-release-candidate`
Control head for this procedure: `deea29d5e4f7b4c54e9c90d5fb169b4dff79068e`
Latest runtime head contained in this control baseline: `c7ecbc31c52387d6a4601f1b86cab35e481355e6`
Canonical database target: `bwes-cluster`
Canonical localhost port: `3000`

## Purpose

`BWE-13` exists to prove that the currently accepted BWE release candidate behaves the same on a genuinely separate machine/runtime environment.

The goal is to detect:

- machine-specific dependencies
- missing or mismatched environment contracts
- path assumptions
- missing local-only files
- auth/session drift between machines

The following do **not** qualify as second-machine proof:

- another terminal window on the same Mac
- another browser on the same machine
- incognito / private mode
- another localhost port on the same machine
- another user profile on the same operating system
- another OpenClaw session on the same machine

## Required target state

- REPO: `/Users/blackforge/workspace/bwe/repos/repo_clean`
- BRANCH: `friday-release-candidate`
- COMMIT: `deea29d5e4f7b4c54e9c90d5fb169b4dff79068e`

If a later approved control-only commit exists at execution time, record:

- CONTROL HEAD
- LATEST RUNTIME HEAD

Do not test a different runtime version without recording the variance explicitly.

## Machine prerequisites

Record on the second machine:

- machine identifier: non-sensitive description only
- operating system
- Node version
- npm version
- whether `npm install` / `npm ci` completes without missing dependency defects

Current primary-machine baseline:

- Node: `v24.15.0`
- npm: `11.12.1`

## Environment contract

Never print secret values.

For each relevant variable, report only one of:

- `PRESENT`
- `MISSING`
- `MATCH`
- `MISMATCH`
- `NOT REQUIRED`
- `NOT SAFELY VERIFIABLE`

### Required local auth/runtime contract

- `JWT_SECRET`: required
- `NEXTAUTH_SECRET`: required
- `NEXTAUTH_URL`: required
- `MONGODB_URI`: required
- `MONGODB_DB`: required

### Required relationship

- `JWT_SECRET` and `NEXTAUTH_SECRET` must both be set and must match

### URL contract

- `APP_URL`: optional for local, required for preview/production parity assessment
- `NEXT_PUBLIC_APP_URL`: optional for local, required for preview/production parity assessment
- `NEXT_PUBLIC_BASE_URL`: optional

### Payment / commerce contract

- `STRIPE_SECRET_KEY`: optional for local parity unless payment routes are being exercised
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: optional for local parity unless payment routes are being exercised
- `STRIPE_WEBHOOK_SECRET`: optional for local parity unless webhook/payment truth is being exercised
- `PLATFORM_STRIPE_ACCOUNT_ID`: optional

### Media contract

- Cloudinary variables: `NOT REQUIRED` for basic auth/session parity unless the proof explicitly exercises Cloudinary-dependent surfaces

## Startup procedure

1. Verify the repo, branch, and commit.
2. Install dependencies if needed.
3. Run:

```bash
npm run check:env:local
npm run dev
```

4. Confirm the app listens on `http://127.0.0.1:3000`.
5. Confirm `/` returns `200`.

## Runtime parity checklist

The second machine must prove:

- app starts successfully
- localhost responds on port `3000`
- Mongo connection succeeds
- canonical DB target remains `bwes-cluster`
- Student Hub storage mode remains `database`
- no machine-specific absolute-path dependency is required
- no required file exists only on the original machine
- no dependency on temporary recovery artifacts is required for normal startup

## Required validation commands

Run on the second machine:

```bash
npm run check:env:local
npm run typecheck
npm run check:critical-paths
```

If the standard auth proof helper is available and safe to run in the second environment, also run:

```bash
npm run proof:auth-session-matrix
```

## Required auth endpoint proof

At minimum verify `/api/auth/me`:

- guest -> anonymous/null state as expected
- user -> `accountType: user`
- business owner -> `accountType: business`
- seller -> `accountType: seller`
- employer -> `accountType: employer`
- admin -> `accountType: admin`

Critical regression guard:

- business session must **not** incorrectly resolve as seller

## Required protected route proof

At minimum verify:

- `/dashboard`
- `/admin/dashboard`
- `/marketplace/dashboard`
- `/employer`
- `/add-business`

Check:

- guest redirect or denial
- correct authenticated-role access
- no authorization escalation

## Required protected API proof

At minimum verify:

- `/api/auth/me`
- `/api/admin/dashboard-stats`
- `/api/marketplace/readiness`
- `/api/employer/stats`

Check:

- guest denial / anonymous behavior matches primary machine
- authorized-role responses match primary machine intent

## Required dashboard proof

Browser/runtime proof must show:

- USER -> `User Dashboard`
- BUSINESS OWNER -> `BWE Global Dashboard` / business workspace
- SELLER -> `Seller Dashboard`
- EMPLOYER -> `Employer Dashboard`
- ADMIN -> `Admin Control Center`

No role should land in another role's workspace.

## Primary-machine comparison matrix

Compare the second machine with the accepted primary-machine proof for:

- runtime startup
- DB target
- guest auth boundary
- `/api/auth/me`
- user role
- business role
- seller role
- employer role
- admin role
- protected routes
- protected APIs
- dashboard rendering

For each item, record:

- PRIMARY MACHINE
- SECOND MACHINE
- MATCH: `YES/NO`

## Evidence package required

The second-machine proof is not complete unless it captures:

- repo / branch / commit
- Node / npm versions
- env-contract matrix using status labels only
- startup proof
- localhost `200` proof
- DB target proof
- role/auth proof
- protected route proof
- protected API proof
- dashboard rendering proof
- primary-vs-second-machine comparison table
- any defect classification if parity fails

## Closure rule

`BWE-13` can become `COMPLETE` only if actual second-machine evidence proves:

- COMMIT PARITY: `PASS`
- RUNTIME PARITY: `PASS`
- ENV CONTRACT PARITY: `PASS` or documented acceptable variance
- ROLE AUTH PARITY: `PASS`
- PROTECTED ROUTE PARITY: `PASS`
- PROTECTED API PARITY: `PASS`
- DASHBOARD PARITY: `PASS`

If the second machine is unavailable or any required proof is missing:

- `BWE-13` remains `EXTERNAL PROOF PENDING`

## Current primary-machine accepted baseline

- control head: `deea29d5e4f7b4c54e9c90d5fb169b4dff79068e`
- latest runtime head: `c7ecbc31c52387d6a4601f1b86cab35e481355e6`
- guest `/admin/dashboard` -> redirected/denied
- guest `/api/admin/dashboard-stats` -> `401`
- guest `/api/marketplace/readiness` -> `401`
- guest `/api/employer/stats` -> `401`
- guest `/api/auth/me` -> anonymous/null state
- user dashboard -> `User Dashboard`
- business dashboard -> `BWE Global Dashboard` / business workspace
- seller dashboard -> `Seller Dashboard`
- employer dashboard -> `Employer Dashboard`
- admin dashboard -> `Admin Control Center`
- business-role drift fix present in `/api/auth/me`
