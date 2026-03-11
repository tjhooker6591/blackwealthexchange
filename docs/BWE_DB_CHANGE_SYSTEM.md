# BWE DB Change System

This is the top-level DB process index.

## Source documents

- `docs/MONGODB_CHANGELOG.md`
- `docs/DB_SCHEMA_REGISTER.md`
- `docs/DB_MIGRATIONS.md`
- `docs/DB_ENV_MATRIX.md`
- `docs/DB_CHANGE_PROCESS.md`

## Required behavior going forward

1. Any DB schema/index/env-routing change must update:
   - changelog
   - schema register
   - migrations (or index change note)
   - env matrix (if env routing affected)
2. `npm run check:db-docs` must pass before release promotion.
3. DB-related PR/commit must include:
   - exact collection(s)
   - index impact
   - backfill/migration note
   - rollback note
4. Collections in VERIFY NEXT must remain explicitly listed until validated.
