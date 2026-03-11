# BWE Agent Operating Rules (BlackForge)

## Always required after meaningful work

1. Update status docs:

- `docs/BWE_MASTER_STATUS.md`
- `docs/BWE_MASTER_TASK_LIST.md`

2. Record proof in response and/or artifacts:

- exact changed files
- exact commit hash(es)
- lint/build/smoke outputs
- route/API/screenshots where relevant

3. Update DB docs when DB changes occur:

- changelog/register/migrations/env/process docs

4. Update growth docs when growth strategy changes:

- growth master + related plan/backlog/dashboard docs

5. Keep complete/incomplete/verify-next states current.

## Enforcement hooks

- `npm run check:release-hygiene`
- `npm run check:db-docs`
- release reports must include required proof package.
