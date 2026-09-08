# BWE Mobile (Expo / React Native)

Phase 7 -- Native iOS + Android foundation. Read this before assuming
"the app works" -- see **Verified vs. not verified** below.

## What this is

A real, hand-written Expo/React Native TypeScript source tree that calls
BWE's actual production APIs -- the same `/api/...` routes the web app
uses -- via the Phase 7 Bearer-token auth
(`src/lib/network/shared.ts#getNetworkSession`, extended to accept
`Authorization: Bearer <token>` in addition to the web cookie). It does
not duplicate any backend logic: every screen is a thin client over an
existing endpoint.

## What's implemented

- `src/api/client.ts` -- typed fetch wrapper, attaches the stored Bearer
  token, points at `EXPO_PUBLIC_API_BASE_URL`.
- `src/storage/session.ts` -- `expo-secure-store`-backed token storage
  (the OS keychain/keystore, not AsyncStorage -- this is a real session
  token, not a preference).
- Screens, each calling a real existing endpoint:
  - `LoginScreen` -- `POST /api/auth/login` (now returns `token` in the
    body specifically for native clients, added in this phase).
  - `DirectoryScreen` -- `GET /api/search/businesses`.
  - `MarketplaceScreen` -- `GET /api/marketplace/get-products`.
  - `JobsScreen` -- `GET /api/job-listings`-equivalent job search.
  - `OpportunitiesScreen` -- `GET /api/opportunities/latest`.
  - `AccountScreen` -- `GET /api/auth/me` (Bearer-aware as of Phase 7).
  - `NotificationsScreen` -- `GET /api/notifications/list` (Phase 5/7
    Bearer-aware).
  - `SavedScreen` -- `GET /api/business/follow?mine=1` +
    `GET /api/user/save-business` (Phase 5/7 Bearer-aware).
  - `BusinessManagementScreen` -- `GET /api/user/managed-businesses` +
    `POST /api/business/updates` (owner-only, same server-side
    verified-ownership check as web -- Phase 7 does not weaken it).
  - `AiModeScreen` -- `POST /api/v1/ai/mode` (Phase 7 AI Mode).

## Verified vs. not verified -- read this before reporting Phase 7 status

**Verified in this session:**

- Every screen's `fetch` calls target real, currently-working API routes
  (confirmed against the live dev server while building this).
- The Bearer-token auth path (`token` in the login response,
  `Authorization: Bearer` accepted by `getNetworkSession`) was verified
  with `curl` against the real running server -- see the Phase 7 closure
  report.

**NOT verified, and NOT claimed complete:**

- This project has **not** been built with `expo prebuild` / Xcode, has
  **not** run in an iOS Simulator, and has **not** run on an Android
  emulator. This machine has only the Xcode Command Line Tools installed
  (`xcodebuild` reports "requires Xcode" -- no simulator runtime), and has
  no Android SDK / `adb` / emulator at all. `npm run typecheck` in this
  directory is the actual, provable verification step available here (it
  compiles/type-checks every file above against React Native's real
  type definitions).
- No App Store or Play Store submission of any kind has happened or is
  implied by this code existing.

## Owner-required next steps for a real device/simulator build

1. On a machine with full Xcode installed (not just Command Line Tools):
   `cd mobile && npm install && npx expo prebuild && npx expo run:ios`.
2. On a machine with Android Studio + an SDK/emulator configured:
   `npx expo run:android`.
3. An Apple Developer Program account + provisioning profile is required
   to run on a physical iOS device or submit to TestFlight/App Store.
4. A Google Play Console account + signing key is required to submit to
   Play Store (an emulator build needs neither).

## Environment

Set `EXPO_PUBLIC_API_BASE_URL` (e.g. `http://127.0.0.1:3000` for local
dev against the Next.js app in this same repo, or the deployed URL) via
`.env` / `app.config.js` env injection before running.
