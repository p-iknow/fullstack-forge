# Auth PRD Implementation Gap Check

PRD source of truth:
- `docs/01-prd/01-auth/01-overview.md`
- `docs/01-prd/01-auth/02-api.md`
- `docs/01-prd/01-auth/04-ui.md`
- `docs/01-prd/01-auth/05-events.md`

## Requirement Coverage Matrix

| Requirement | Implemented | Tested | Evidence |
| --- | --- | --- | --- |
| Email login/logout | yes | yes | `apps/api/src/routes/auth/login/handler.ts`, `apps/api/src/routes/auth/login/handler.test.ts`, `apps/api/src/routes/auth/logout/handler.ts`, `apps/api/src/routes/auth/logout/handler.test.ts` |
| OAuth start/callback (google, kakao) | yes | yes | `apps/api/src/routes/auth/oauth/start/handler.ts`, `apps/api/src/routes/auth/oauth/start/handler.test.ts`, `apps/api/src/routes/auth/oauth/callback/handler.ts`, `apps/api/src/routes/auth/oauth/callback/handler.test.ts` |
| Refresh rotation/reuse detection | yes | yes | `apps/api/src/routes/auth/@shared/session/session.ts`, `apps/api/src/routes/auth/@shared/session/session.test.ts`, `apps/api/src/routes/auth/refresh/handler.ts`, `apps/api/src/routes/auth/refresh/handler.test.ts` |
| Login lockout and rate limit | yes | yes | `apps/api/src/routes/auth/login/account-lockout.ts`, `apps/api/src/routes/auth/login/handler.ts`, `apps/api/src/routes/auth/login/handler.test.ts` |
| Admin role guard (`operator|admin`) | yes | yes | `apps/api/src/routes/auth/@shared/http/middleware.ts`, `apps/api/src/routes/admin.test.ts` |
| Auth audit events (`login_*`, `oauth_*`, `logout`, `session_revoked`) | yes | partial | `apps/api/src/routes/auth/@shared/audit/audit.ts`, handler tests |
| Password reset request/confirm | no | no | no route in `apps/api/src/routes/auth`, no endpoint in `packages/api-spec/src/routes/auth/index.ts` |
| Store UI login entry points (email/google/kakao) | yes | no | `apps/store/src/routes/login.tsx` |
| Session-expired auto redirect + toast | no | no | no dedicated redirect/toast behavior found in `apps/store/src/routes/index.tsx` |

## Current Gaps

1. Password reset (`POST /auth/password-reset/request`, `POST /auth/password-reset/confirm`) is not implemented.
2. Frontend auth routes in store/admin have no test files yet.
3. Some API edge-case tests were missing and are covered in this branch update.

## Scope of This Branch

- Add missing backend auth tests for PRD-aligned edge cases.
- Do not introduce password reset implementation in this change set.
