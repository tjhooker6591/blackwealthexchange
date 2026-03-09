# Complete Environment Matrix (codebase-derived)

| Variable | Source file(s) / feature | Local required | Preview required | Production required |
|---|---|---|---|---|
| `ADMIN_API_KEY` | src/pages/api/advertising/checkout.ts | no | no | no |
| `ADMIN_EMAILS` | src/pages/api/admin/approve-business.ts, src/pages/api/admin/approve-directory-listing.ts, src/pages/api/admin/approve-product.ts (+16 more) | no | no | no |
| `APP_URL` | src/pages/api/auth/forgot-password.ts | no | yes | yes |
| `BWE_EVENTS_RSS_ALLOWLIST` | src/pages/api/events/rss.ts | no | no | no |
| `BWE_EVENTS_RSS_URLS` | src/pages/api/events/rss.ts | no | no | no |
| `DIRECTORY_EXPIRING_SOON_DAYS` | src/pages/api/admin/directory-slots.ts | no | no | no |
| `DIRECTORY_FEATURED_MAX_SLOTS` | src/pages/api/admin/approve-directory-listing.ts, src/pages/api/admin/directory-slots.ts | no | no | no |
| `EMAIL_PASS` | src/pages/api/auth/forgot-password.ts, src/pages/api/auth/request-reset.ts, src/pages/api/auth/signup.ts | no | no | no |
| `EMAIL_USER` | src/pages/api/auth/forgot-password.ts, src/pages/api/auth/request-reset.ts, src/pages/api/auth/signup.ts | no | no | no |
| `ENV_CHECK_TARGET` | scripts/check-env.mjs | no | no | no |
| `FRONTEND_URL` | src/pages/api/checkout/create-session.ts | no | no | no |
| `JWT_SECRET` | scripts/check-env.mjs, src/pages/api/admin/approve-business.ts, src/pages/api/admin/approve-directory-listing.ts (+46 more) | yes | yes | yes |
| `MONGODB_ATLAS_URI` | scripts/stamp-directory-completeness.mjs, src/pages/api/organizations/[slug].ts, src/pages/api/searchBusinesses.js (+1 more) | no | no | no |
| `MONGODB_DB` | scripts/check-critical-indexes.mjs, scripts/check-critical-paths.mjs, scripts/p2-regression-check.mjs (+5 more) | yes | yes | yes |
| `MONGODB_DB_NAME` | src/pages/api/admin/consulting-interests.ts, src/pages/api/admin/dashboard.ts, src/pages/api/stripe/webhook-handler.ts | no | no | no |
| `MONGODB_URI` | scripts/check-critical-indexes.mjs, scripts/check-critical-paths.mjs, scripts/check-env.mjs (+7 more) | yes | yes | yes |
| `MONGO_DB_NAME` | scripts/stamp-directory-completeness.mjs, src/pages/api/organizations/[slug].ts, src/pages/api/searchOrganizations.js | no | no | no |
| `MONGO_URI` | scripts/check-critical-indexes.mjs, scripts/check-critical-paths.mjs, scripts/p2-regression-check.mjs (+5 more) | no | no | no |
| `NEXTAUTH_SECRET` | scripts/check-env.mjs, src/pages/api/admin/approve-business.ts, src/pages/api/admin/approve-directory-listing.ts (+29 more) | yes | yes | yes |
| `NEXTAUTH_URL` | src/pages/api/advertising/checkout.ts, src/pages/api/marketplace/delete-product.ts | yes | yes | yes |
| `NEXT_PUBLIC_APP_URL` | src/pages/api/auth/forgot-password.ts, src/pages/api/checkout/create-session.ts | no | yes | yes |
| `NEXT_PUBLIC_BASE_URL` | src/pages/api/admin/run-directory-cron.ts, src/pages/api/ads/create-checkout-session.ts, src/pages/api/auth/forgot-password.ts (+1 more) | no | no | no |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | src/pages/sellers/add-product.tsx | no | no | no |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | src/pages/sellers/add-product.tsx | no | no | no |
| `NEXT_PUBLIC_SITE_URL` | src/pages/api/advertising/checkout.ts, src/pages/api/checkout/create-session.ts | no | no | no |
| `NODE_ENV` | src/lib/db/ads.ts, src/lib/env.ts, src/lib/mongodb.ts (+27 more) | no | no | no |
| `OPENAI_API_KEY` | src/pages/api/ai/answers.ts | no | no | no |
| `OPENAI_MODEL` | src/pages/api/ai/answers.ts | no | no | no |
| `PLATFORM_STRIPE_ACCOUNT_ID` | src/pages/api/stripe/checkout.ts | no | no | no |
| `RESET_DEBUG_MODE` | src/pages/api/auth/request-reset.ts | no | no | no |
| `RESET_TOKEN_SECRET` | src/pages/api/auth/forgot-password.ts | no | no | no |
| `SITE_URL` | src/pages/api/advertising/checkout.ts, src/pages/api/checkout/create-session.ts | no | no | no |
| `SMOKE_BASE_URL` | scripts/check-buy-flows.mjs, scripts/check-critical-paths.mjs, scripts/check-internal-links.mjs (+4 more) | no | no | no |
| `SMTP_FROM` | src/lib/sendEmail.ts | no | no | no |
| `SMTP_HOST` | src/lib/sendEmail.ts | no | no | no |
| `SMTP_PASS` | src/lib/sendEmail.ts | no | no | no |
| `SMTP_PORT` | src/lib/sendEmail.ts | no | no | no |
| `SMTP_USER` | src/lib/sendEmail.ts | no | no | no |
| `STRIPE_SECRET_KEY` | src/lib/stripe.ts, src/pages/api/ads/create-checkout-session.ts, src/pages/api/advertising/checkout.ts (+8 more) | no | yes | yes |
| `STRIPE_WEBHOOK_SECRET` | src/pages/api/stripe-webhook.ts, src/pages/api/stripe/webhook-handler.ts | no | yes | yes |
| `VERCEL_ENV` | src/lib/env.ts | no | no | no |
| `VERCEL_PROJECT_PRODUCTION_URL` | src/pages/api/checkout/create-session.ts | no | no | no |
| `VERCEL_URL` | src/pages/api/auth/forgot-password.ts | no | no | no |