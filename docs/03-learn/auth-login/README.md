# 인증/로그인 체계 심층 분석

이 프로젝트의 인증 구현(Email + Google/Kakao OAuth, 세션 회전, 프론트 상태 동기화)을 단계별로 분해하여,
**왜 이 구조를 선택했는지**, **2026년 기준으로 적절한지**, **실제 코드에서 어떻게 연결되는지** 를 설명한다.

> 기준 환경: Hono + Drizzle + PostgreSQL + Redis · TanStack Start · TanStack Query v5 · ky

## 문서 순서

| #   | 문서                                                                        | 핵심 질문                                                          |
| --- | --------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 01  | [이 서비스의 로그인 인증 형태](./01-login-auth-model.md)                    | 이 서비스의 로그인 인증은 어떤 형태(토큰/세션/OAuth)로 진행되는가? |
| 02  | [JWT + Stateful Refresh 하이브리드 선택 이유](./02-why-jwt-hybrid.md)       | 왜 access JWT + stateful refresh 하이브리드로 설계했는가?          |
| 03  | [이메일 로그인 검증 순서와 방어선](./03-email-login-guardrails.md)          | 이메일 로그인에서 방어선은 어떤 순서로 적용되는가?                 |
| 04  | [Refresh Rotation과 재사용 탐지](./04-refresh-rotation-reuse-detection.md)  | 세션 연장 시 refresh 토큰은 어떻게 회전·탐지되는가?                |
| 05  | [OAuth 서버 Callback과 State 검증](./05-oauth-callback-state-validation.md) | OAuth는 왜 서버 callback + state 검증으로 처리하는가?              |
| 06  | [프론트 인증 상태 동기화(TanStack Query)](./06-frontend-auth-state-sync.md) | 로그인 이후 화면 상태는 왜 query invalidation으로 동기화하는가?    |

## 전제 지식

- HTTP 쿠키(`HttpOnly`, `SameSite`, `Secure`)의 기본 동작
- OAuth Authorization Code Flow의 개념
- TanStack Query의 query/mutation 기본 사용법

## 이 프로젝트의 설정 파일

```text
apps/api/
├── src/routes/auth/
│   ├── index.ts
│   ├── @shared/
│   │   ├── config/constants.ts
│   │   ├── http/{middleware.ts,service.ts,schemas.ts}
│   │   ├── security/{password.ts,rate-limit.ts}
│   │   └── session/{session.ts,tokens.ts}
│   ├── signup/{schema.ts,route.ts,handler.ts,handler.test.ts}
│   ├── login/{schema.ts,route.ts,handler.ts,account-lockout.ts,handler.test.ts}
│   ├── refresh/{schema.ts,route.ts,handler.ts,handler.test.ts}
│   ├── logout/{schema.ts,route.ts,handler.ts,handler.test.ts}
│   ├── me/{schema.ts,route.ts,handler.ts,handler.test.ts}
│   └── oauth/
│       ├── @shared/{schema.ts,service.ts,state.ts,providers/*}
│       ├── start/{schema.ts,route.ts,handler.ts,handler.test.ts}
│       └── callback/{schema.ts,route.ts,handler.ts,handler.test.ts}
├── src/lib/{create-app.ts,errors.ts,openapi.ts,types.ts}
└── .env.example

apps/store/
├── src/@shared/api/
│   ├── core.ts
│   └── domains/auth-client.ts
├── src/@shared/queries/auth.ts
└── src/routes/
    ├── index.tsx
    ├── login.tsx
    ├── signup.tsx
    └── auth.callback.success.tsx
```

## 연관 문서

- 구현 레시피(백엔드): [architecture/backend/01-backend](../../02-architecture/backend/01-backend.md)
- 연동 레시피(프론트↔백): [architecture/integration/01-integration](../../02-architecture/integration/01-integration.md)
- 요구사항 기준: [prd/01-auth/overview](../../01-prd/01-auth/01-overview.md)
