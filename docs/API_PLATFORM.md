# BWE API Platform

Phase 7 -- API Platform. This documents the conventions the existing 291
API routes (`docs/API_PLATFORM_INVENTORY.md`, auto-generated -- run
`node scripts/generate-api-inventory.mjs` after any API change) already
follow in practice, and the ones new routes (web, mobile, AI) should
follow going forward. **Existing stable routes are not rewritten to fit
this document** -- see "Migration stance" below.

## Authentication

Three models are in active use (see the inventory's "By auth model"
breakdown):

- **Session (cookie or Bearer)** -- `src/lib/network/shared.ts`'s
  `getNetworkSession(req)`. Reads the `session_token` JWT from either the
  `session_token` httpOnly cookie (web) or an `Authorization: Bearer
<token>` header (mobile/native, added in Phase 7). This is the
  canonical resolver for every new session-gated route.
- **Session (cookie only)** -- older routes that inline their own
  `cookie.parse(...)` + `jwt.verify(...)`. Not retrofitted route-by-route;
  `/api/auth/me` was additionally given Bearer support in Phase 7 since
  it's the one profile endpoint mobile clients call directly.
- **Admin** -- `src/lib/adminAuth.ts`'s `requireAdminFromRequest(req, res)`.
  Unchanged by Phase 7.

Every session/admin JWT is the same token format issued by
`/api/auth/login`, which now also returns it as `token` in the JSON body
(additive -- the web client still uses the cookie and ignores this field)
specifically so native/mobile clients have something to store and send
back as a Bearer header.

## Versioning strategy

BWE's existing 291 routes are unversioned (`/api/<resource>`) and stable
-- **not renamed or moved**, since that would break every existing web
caller for no benefit. Phase 7 establishes `/api/v1/` as the prefix for
**new, mobile/AI-facing routes going forward**, so a future breaking
change has a place to go (`/api/v2/...`) without disturbing `/api/v1/...`
or the legacy unversioned routes. Existing routes are not required to
move into `/api/v1/`.

## Response contract

Existing routes use several response shapes (`{ok, ...}`, bare arrays,
`{success, ...}`, resource-specific shapes) -- **not unified retroactively**.
New routes should return:

```json
// success
{ "ok": true, "data": { ... } }
// error
{ "ok": false, "error": { "code": "SOME_CODE", "message": "human-readable" } }
```

`src/lib/adminApiContract.ts` already establishes this exact shape for
admin routes (`adminFail`, `ADMIN_ERROR_CODES`); Phase 7 routes follow the
same pattern rather than a third convention.

## Pagination

Existing list endpoints already use `page`/`limit` (or `limit`/`cursor`)
query params (see the inventory). New list endpoints should do the same:
`limit` (bounded, e.g. `Math.min(rawLimit, 100)`), `page` starting at 1 or
a `cursor` for large collections.

## Rate limiting

`src/lib/apiRateLimit.ts` (`hitApiRateLimit`, backed by the
`api_rate_limits` collection with a TTL index) is the existing shared rate
limiter, already used on 20+ routes (see the inventory's "Rate limited"
column). New public-facing write routes (signup, login, AI Mode, mobile
auth) should call it rather than adding a second rate-limiting mechanism.

## Schema validation

No schema-validation library (zod, yup, etc.) exists in the project yet.
Phase 7 does not introduce one for a handful of new routes -- existing
routes validate inputs with hand-written checks, and the new Phase 7
routes (AI Mode, mobile) follow that same convention for consistency.
Introducing a validation library is a reasonable future improvement but
out of Phase 7's scope (would mean touching many existing routes to be
consistent, which risks the stable routes this document says not to
rewrite).

## Observability hooks

`src/lib/observability/logHealthEvent.ts` (Phase 7) writes to the existing
`system_health_logs` collection, already read by three dashboards. New
routes that represent a critical workflow (payments, auth, AI, mobile)
should log failures through it -- see its use in
`src/pages/api/stripe/webhook-handler.ts` and `src/pages/api/auth/login.ts`
for the pattern (best-effort, never masks the original error response).

## Migration stance

**Do not rewrite a stable, working route to match this document.** The
291 routes in the inventory work today and changing their response shape,
auth check, or URL would be a breaking change for existing web clients
with no corresponding benefit. This document governs new routes.
