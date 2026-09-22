# Marketplace Environment Contract

This contract prevents hidden Marketplace data drift across environments.

## Required variables

- `MONGODB_URI` (required)
- `MONGODB_DB` (required, canonical value: `bwes-cluster` for local runtime)

## Rules

1. Marketplace APIs resolve DB from **`MONGODB_DB` only**.
2. No Marketplace endpoint may silently switch to another DB at runtime.
3. In local/dev (`getAppEnv() === "local"`), Marketplace APIs throw an error unless:
   - `MONGODB_DB=bwes-cluster`
4. `/api/marketplace/get-products?debug=1` always returns:
   - `_debug.usedDbName`
   - `_debug.environment`

## Operational checks

Before running local Marketplace:

```bash
echo "$MONGODB_DB"
# must print: bwes-cluster
```

If local runtime starts with another DB name, Marketplace APIs will fail fast by design.
