# DB Environment Matrix

Defines MongoDB routing and safety expectations per environment.

| Environment | DB Name | URI Source | Allowed Host Pattern | Notes |
|---|---|---|---|---|
| local | `bwes-cluster` (default) or `MONGODB_DB` | `MONGODB_URI` / `MONGO_URI` | localhost or remote allowed | local debugging + seeded QA data |
| preview/QA | `MONGODB_DB` required | `MONGODB_URI` | remote only (no localhost) | mirror production-like indexes |
| production | `MONGODB_DB` required | `MONGODB_URI` | remote only (no localhost) | no direct experiments |

## Required env keys (DB-related)
- `MONGODB_URI`
- `MONGODB_DB` (recommended explicit)

## Critical route DB behavior
- Auth reset routes use `getMongoDbName()`
- Recruiting intake routes use `getMongoDbName()`
- Mongo client uses centralized env-safe URI handling

## Promotion checks
1. Verify env diff for DB keys only contains approved changes.
2. Run `npm run check:critical-indexes` in preview and production.
3. Run built-runtime smoke checks after deployment.
