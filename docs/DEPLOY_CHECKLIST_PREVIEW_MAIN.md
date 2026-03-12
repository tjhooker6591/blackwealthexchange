# Deploy Checklist — Preview → Main (Detect-Only Guardrails)

This checklist is intentionally non-destructive. It validates readiness and prints actionable failures.

## 0) Environment baseline
- Use Node 22 LTS (`.nvmrc`)
- Confirm `.env.local` is loaded for local checks
- Avoid stale `.next`/dependency state when odd runtime errors appear

## 1) Manual preflight commands
Run in repo root:

```bash
npm run check:env:local
npm run preflight:local
npm run smoke:local
```

## 2) Full local readiness lane
```bash
npm run check:release-readiness
```

This runs the critical validation lane (runtime/paths/regressions/indexes/docs/hygiene).

## 3) Preview deployment discipline
- Promote only after local readiness is green.
- Ensure preview env vars match expected contract (NEXTAUTH/MONGO/STRIPE).
- Verify auth + checkout + core navigation smoke in preview.

## 4) Main deployment discipline
- Promote the exact known-good commit range.
- Re-run smoke checks immediately post-deploy.
- If runtime instability appears, restart with clean build artifacts on target host.

## 5) Non-goals of these scripts
- No automatic deletion
- No repo mutation
- No install-time hard-fail hooks
- No runtime behavior changes
