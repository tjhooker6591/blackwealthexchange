# Route Smoke-Test Checklist

Run in built runtime (`next build && next start`) before preview/prod promotion.

## Web routes
- `/`
- `/business-directory`
- `/recruiting-consulting`
- one business detail page
- one organization detail page

## API routes
- `GET /api/auth/session`
- `POST /api/auth/request-reset`
- `POST /api/consulting-intake`
- `GET /api/searchBusinesses`
- `GET /api/searchOrganizations`

## Commanded checks
- `npm run smoke:routes`
- `npm run check:critical-indexes`

## Pass criteria
- All routes return 2xx
- No 500s in auth/reset path
- No regressions in directory detail loading
