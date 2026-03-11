# Portability Closure Checklist

References:

- Env contract: `docs/ENV_VARS.md`
- Complete env matrix: `docs/ENVIRONMENT_MATRIX_COMPLETE.md`
- Setup/deploy runbook: `docs/SETUP_DEPLOYMENT_RUNBOOK.md`

---

## 1) Main Dev Machine (close first)

| Check item                            | Command / verification method                                                     | Pass/Fail         | Notes |
| ------------------------------------- | --------------------------------------------------------------------------------- | ----------------- | ----- |
| Install parity                        | `node -v && npm -v && npm ci`                                                     | [ ] PASS [ ] FAIL |       |
| Env contract passes (local)           | `npm run check:env:local`                                                         | [ ] PASS [ ] FAIL |       |
| Auth secrets present + aligned        | `check:env:local` output shows no JWT/NEXTAUTH errors                             | [ ] PASS [ ] FAIL |       |
| Clean runtime start on :3000          | `rm -rf .next && PORT=3000 npm run dev`                                           | [ ] PASS [ ] FAIL |       |
| Readiness reached                     | `curl -I http://127.0.0.1:3000/` returns 200/307/308                              | [ ] PASS [ ] FAIL |       |
| Homepage healthy                      | `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/`                   | [ ] PASS [ ] FAIL |       |
| Login page healthy                    | `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/login`              | [ ] PASS [ ] FAIL |       |
| Session endpoint healthy              | `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/auth/session`   | [ ] PASS [ ] FAIL |       |
| Auth-me endpoint healthy (if present) | `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/auth/me`        | [ ] PASS [ ] FAIL |       |
| Login API no missing-secret error     | POST `/api/auth/login` test payload (non-empty response, no "Missing JWT secret") | [ ] PASS [ ] FAIL |       |
| Protected route behavior correct      | Open one protected route and verify expected auth guard behavior                  | [ ] PASS [ ] FAIL |       |
| DB-backed route healthy               | `/marketplace` or `/business-directory` loads without runtime 500                 | [ ] PASS [ ] FAIL |       |
| No chunk/module/white-page errors     | Inspect dev log tail (`tail -n 120 /tmp/main-dev.log`)                            | [ ] PASS [ ] FAIL |       |

**Main Dev Machine PASS criteria**

- `check:env:local` passes
- app starts on `localhost:3000`
- `/`, `/login`, `/api/auth/session`, `/api/auth/me` respond as expected
- `/api/auth/login` no longer throws missing secret
- one protected route behaves correctly
- one DB-backed route loads
- no chunk/module/white-page runtime errors

---

## 2) Preview (close second)

| Check item                         | Command / verification method                                      | Pass/Fail         | Notes |
| ---------------------------------- | ------------------------------------------------------------------ | ----------------- | ----- |
| Preview env contract passes        | `npm run check:env:preview` (or key-by-key parity check vs matrix) | [ ] PASS [ ] FAIL |       |
| Auth/env key name parity           | Compare preview env keys to `docs/ENVIRONMENT_MATRIX_COMPLETE.md`  | [ ] PASS [ ] FAIL |       |
| Deploy target commit               | Confirm preview URL + commit SHA                                   | [ ] PASS [ ] FAIL |       |
| Homepage healthy                   | `curl -I <preview-url>/`                                           | [ ] PASS [ ] FAIL |       |
| Login page healthy                 | `curl -I <preview-url>/login`                                      | [ ] PASS [ ] FAIL |       |
| Session endpoint healthy           | `curl -I <preview-url>/api/auth/session`                           | [ ] PASS [ ] FAIL |       |
| Protected route behavior correct   | Browser/auth check on one protected route                          | [ ] PASS [ ] FAIL |       |
| Public DB-backed route healthy     | `<preview-url>/marketplace` or `/business-directory`               | [ ] PASS [ ] FAIL |       |
| Payment route health (if in scope) | Non-destructive checkout/session probe                             | [ ] PASS [ ] FAIL |       |
| No runtime 500/chunk errors        | Preview logs + browser validation                                  | [ ] PASS [ ] FAIL |       |

**Preview PASS criteria**

- required preview env keys are present and named correctly
- deployed preview URL serves core auth/public/protected checks
- DB-backed page passes
- no runtime chunk/module/500 failures

---

## 3) Production Env Parity (close third)

| Check item                                | Command / verification method                                     | Pass/Fail         | Notes |
| ----------------------------------------- | ----------------------------------------------------------------- | ----------------- | ----- |
| Production key-name parity                | Compare prod env keys to `docs/ENVIRONMENT_MATRIX_COMPLETE.md`    | [ ] PASS [ ] FAIL |       |
| Auth vars correct                         | `JWT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` present + aligned | [ ] PASS [ ] FAIL |       |
| URL vars correct                          | `APP_URL`, `NEXT_PUBLIC_APP_URL` set to production URL            | [ ] PASS [ ] FAIL |       |
| DB vars correct                           | `MONGODB_URI` non-localhost + `MONGODB_DB` set                    | [ ] PASS [ ] FAIL |       |
| Stripe vars correct (if payments enabled) | `STRIPE_SECRET_KEY`, publishable key, webhook secret present      | [ ] PASS [ ] FAIL |       |
| Homepage smoke                            | `curl -I https://www.blackwealthexchange.com/`                    | [ ] PASS [ ] FAIL |       |
| Login smoke                               | `curl -I https://www.blackwealthexchange.com/login`               | [ ] PASS [ ] FAIL |       |
| Session smoke                             | `curl -I https://www.blackwealthexchange.com/api/auth/session`    | [ ] PASS [ ] FAIL |       |
| Protected route auth behavior             | Browser/auth check on production protected route                  | [ ] PASS [ ] FAIL |       |
| Public DB-backed route smoke              | `/marketplace` or `/business-directory`                           | [ ] PASS [ ] FAIL |       |
| Payment route health (safe)               | Non-destructive payment health probe                              | [ ] PASS [ ] FAIL |       |
| Rollback SHA recorded                     | Record rollback target in release notes                           | [ ] PASS [ ] FAIL |       |

**Production PASS criteria**

- required production env key names and values are present/correct
- auth, URL, DB, and payment envs (if enabled) are valid
- production smoke checks pass
- rollback target recorded
