# DB Change Process

Process for schema/index/env DB changes.

## 1. Propose

- Add/update docs in:
  - `docs/DB_SCHEMA_REGISTER.md`
  - `docs/DB_MIGRATIONS.md`
  - `docs/DB_ENV_MATRIX.md`
- Include rollback note and affected collections.

## 2. Implement

- Apply minimal code/index changes.
- Use centralized env helpers (`getMongoDbName`, `getMongoUri`).
- Never store sensitive raw tokens (hash only).

## 3. Verify in built runtime

- `npm run build`
- `npm run smoke:routes`
- `npm run check:critical-indexes`
- Route-specific e2e checks when applicable.

## 4. Promotion package (required)

- exact commit hash(es)
- changed files list
- env diff summary
- smoke/index check outputs
- rollback target

## 5. Post-deploy

- re-run smoke + index checks
- update `docs/DB_MIGRATIONS.md` with applied date/status

## VERIFY NEXT workflow

Collections listed under VERIFY NEXT must receive:

1. field contract write-up,
2. index plan,
3. runtime path map,
4. migration/backfill notes,
   before release hard freeze.
