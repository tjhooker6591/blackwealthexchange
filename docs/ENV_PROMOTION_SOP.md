# Environment Promotion SOP (local → preview/QA → production)

## Purpose
Prevent production breakage by promoting only validated builds with explicit env + smoke proof.

## Preconditions (required)
- `npm run lint` passes (no new errors)
- `npm run build` passes
- `next build && next start` smoke tested
- working tree clean for release commit/tag

## Stage 1 — Local validation
1. Run built runtime locally:
   - `npm run build`
   - `npm run start`
2. Verify core routes:
   - `/`
   - `/business-directory`
   - `/api/auth/session`
   - `/api/auth/request-reset` (POST)
3. Capture:
   - commit hash
   - changed files
   - lint/build output

## Stage 2 — Preview / QA
1. Deploy same commit hash to preview/QA.
2. Apply preview env manifest (no prod secrets).
3. Run smoke checklist:
   - auth login/session/reset
   - directory search/detail click
   - marketplace browse + checkout path (non-live charge)
   - recruiting intake submission
4. Record results and blockers.

## Stage 3 — Production promotion
1. Promote exact preview-tested commit hash.
2. Apply production env manifest.
3. Confirm env diff (preview vs production) only on approved keys.
4. Run post-deploy smoke:
   - homepage
   - directory
   - auth session + reset request
   - one monetization route
5. Note rollback target commit.

## Required release evidence
- exact commit hashes
- changed file list
- env diff check summary
- smoke test results
- rollback target
- DB index/migration note

## Rollback procedure
1. Redeploy previous stable commit hash.
2. Re-run core smoke checklist.
3. Post incident note with root cause + prevention.
