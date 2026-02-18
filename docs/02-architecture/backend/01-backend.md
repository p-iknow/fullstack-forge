# 04. Backend — apps/api 계층

`fullstack-forge`의 백엔드 기준: **퀵커머스 주문-배송 앱 구현**을 위한 API 골격(Hono + Drizzle ORM + PostgreSQL + Redis). Node.js 런타임.
인증(auth)은 공통 기초 단계이며, 이후 주문/리뷰/문의/이벤트/워커로 확장한다.

## 결정사항

| 항목           | 결정                               | 근거                                        |
| -------------- | ---------------------------------- | ------------------------------------------- |
| 런타임         | Node.js (`@hono/node-server`)      | 안정성 우선                                 |
| 웹 프레임워크  | Hono                               | 작고 타입 친화적인 라우팅                   |
| ORM            | Drizzle ORM                        | SQL 가시성 + 타입 안전 스키마               |
| DB             | PostgreSQL                         | 운영 검증된 관계형 DB                       |
| 캐시           | Redis                              | revoke denylist/state/nonce/rate-limit 캐시 |
| 메트릭         | Prometheus + Grafana               | `/metrics` 스크레이프 기반 관측             |
| 컨테이너       | Docker                             | 로컬/CI 환경 일관성                         |
| 오케스트레이션 | Kubernetes                         | 확장/롤링 배포/자가복구                     |
| 마이그레이션   | drizzle-kit                        | schema.ts 기반 DDL 생성/적용                |
| Dev 서버       | `vite` (@hono/vite-dev-server)     | HMR, Vite 기반 백엔드 dev 서버              |
| Prod 빌드      | `vite build` (@hono/vite-build)    | Node.js 타겟 프로덕션 번들                  |
| 포트           | 8080                               | 프론트 3000번대와 구분                      |
| 경로 별칭      | `~/` → `./src/`                    | 프론트 앱과 동일 컨벤션                     |
| 로그인 채널    | Email + Google OAuth + Kakao OAuth | 사용자 진입 경로 다양화 + 소셜 간편 로그인  |

## 목표 범위

- Stage 0 기초: `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- Stage 0.5 인증 확장: `GET /auth/oauth/:provider/start`, `GET /auth/oauth/:provider/callback` (`provider`: `google|kakao`)
- Stage 1+ 확장: `POST /orders`, `GET /orders/:id`, `OrderCreated` publish
- Stage 1.5+ 확장: `POST /reviews`, `PATCH /reviews/:id`, `POST /reviews/:id/comments`
- Stage 2+ 확장: `POST /inquiries`, `GET /inquiries/:id`, `POST /inquiries/:id/replies`, `PATCH /inquiries/:id`
- Stage 3+ 확장: notifications/inventory/dispatch worker + idempotency + DLQ/redrive

주문/이벤트 운영 기준은 [PRD 관측성](../../01-prd/14-observability/01-overview.md)을 기준으로 동기화한다.

## 백엔드 구조 원칙 (Hono Best Practice)

- 단일 배포 단위(`apps/api`)로 시작하되, 내부는 도메인 경계로 분리
- API surface 분리: store 요청과 admin 요청의 라우트/권한을 분리
- 비동기 후처리는 worker 경계로 분리 가능한 형태로 설계
- Hono 공식: "Don't make Controllers" — handler를 route 정의와 co-locate
- @hono/zod-openapi: `createRoute()` + `OpenAPIHono`로 타입 안전한 API 구성

권장 내부 경계:

- `routes/{feature}/`: domain-organized API routes
- `routes/{feature}/{feature}.index.ts`: Router entry (createRouter + openapi)
- `routes/{feature}/{feature}.routes.ts`: createRoute() 정의
- `routes/{feature}/{feature}.handlers.ts`: Handler 구현 (HTTP 관심사)
- `routes/{feature}/{feature}.schemas.ts`: Zod request/response 스키마
- `routes/{feature}/{feature}.service.ts`: Business logic (DB, 상태 전이)
- `lib/`: App infrastructure (4 files only: create-app.ts, types.ts, errors.ts, openapi.ts)
- `middleware/`: Cross-cutting middleware (3+ feature에서 공유하는 것만)
- `db/schema/`: Domain별 Drizzle schema (barrel export)
- `events/`: SNS-SQS publish/consume 계약

## 도메인 모델 (인증 + 커머스 확장 예시)

| 엔티티                | 설명                                   |
| --------------------- | -------------------------------------- |
| `users`               | 사용자 계정                            |
| `user_credentials`    | 비밀번호 해시/인증 정보                |
| `user_oauth_accounts` | OAuth provider 계정 연결(google/kakao) |
| `user_sessions`       | 세션/리프레시 토큰 메타                |
| `audit_logs`          | 로그인/로그아웃/보안 이벤트            |
| `reviews`             | 구매 검증 기반 상품 리뷰               |
| `review_comments`     | 리뷰 댓글(고객/운영 상호작용)          |
| `customer_inquiries`  | 고객 문의(주문/상품/배송/계정 등)      |
| `inquiry_replies`     | 운영자/고객 문의 답변 이력             |

## package.json

```jsonc
{
  "name": "@fullstack-forge/api",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "default": "./dist/index.js",
    },
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit",
    "test": "vitest run --passWithNoTests",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "docker:build": "docker build -t repo-api:local -f Dockerfile ../..",
    "docker:run": "docker run --rm -p 8080:8080 --env-file .env repo-api:local",
  },
  "dependencies": {
    "@fullstack-forge/shared": "workspace:*",
    "hono": "catalog:",
    "@hono/node-server": "catalog:",
    "@hono/zod-openapi": "catalog:",
    "@hono/swagger-ui": "catalog:",
    "drizzle-orm": "catalog:",
    "pg": "catalog:",
    "prom-client": "catalog:",
    "redis": "catalog:",
  },
  "devDependencies": {
    "@types/node": "catalog:",
    "@types/pg": "catalog:",
    "drizzle-kit": "catalog:",
    "@hono/vite-dev-server": "catalog:",
    "@hono/vite-build": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:",
  },
}
```

> 위 스크립트는 `pnpm --filter @fullstack-forge/api <script>`로 실행된다는 전제(working dir: `apps/api`)다.

## .env.example

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fullstack_forge_commerce_dev
REDIS_URL=redis://localhost:6379
PROMETHEUS_ENABLED=true
PORT=8080
ACCESS_JWT_SECRET=change-me-access-jwt-secret
ACCESS_JWT_ISSUER=fullstack-forge-api
ACCESS_JWT_AUDIENCE=fullstack-forge-store

# OAuth (Google)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8080/auth/oauth/google/callback

# OAuth (Kakao)
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
KAKAO_OAUTH_REDIRECT_URI=http://localhost:8080/auth/oauth/kakao/callback

# OAuth 공통
OAUTH_STATE_SECRET=change-me
```

## 로컬 부트스트랩 (DB/Redis)

```bash
# 1) env 파일 준비
cp apps/api/.env.example apps/api/.env

# 2) PostgreSQL
docker run --name fullstack-forge-postgres \
  -e POSTGRES_PASSWORD=postgres \
-e POSTGRES_DB=fullstack_forge_commerce_dev \
  -p 5432:5432 -d postgres:16

# 3) Redis
docker run --name repo-redis -p 6379:6379 -d redis:7-alpine

# 4) 연결 확인
pg_isready -h localhost -p 5432 -U postgres
redis-cli -u redis://localhost:6379 PING
```

> `apps/api/.env`는 커밋하지 않는다. 값은 `.env.example`을 기준으로 맞춘다.

## 쿠키 정책 및 보안 헤더

세션/토큰을 쿠키로 전달하는 경우 아래를 기본값으로 사용한다.

- `HttpOnly`: JavaScript 접근 차단
- `Secure`: HTTPS에서만 전송 (로컬 HTTP 개발 시에는 false 허용)
- `SameSite=Lax`: 기본 CSRF 완화. 외부 연동이 많으면 정책 재검토
- `Path=/`, 좁은 `Domain`: 쿠키 범위 최소화

```ts
// 예시 (Hono)
import { setCookie } from 'hono/cookie'

setCookie(c, 'session', sessionToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Lax',
  path: '/',
  maxAge: 60 * 60,
})
```

### 보안 기본선 체크

- 비밀번호는 평문 저장 금지 (`user_credentials.passwordHash` 사용)
- 로그인/리프레시/로그아웃은 감사 로그(`audit_logs`) 남김
- 인증 실패 응답은 상세 원인 노출 금지 (`Invalid credentials` 수준)

비밀번호 해시 예시:

```ts
import { hash, verify } from '@node-rs/argon2'

const passwordHash = await hash(payload.password)
const ok = await verify(storedHash, payload.password)
```

## src/app.ts — OpenAPIHono 앱 + 미들웨어

```ts
// src/app.ts — OpenAPIHono 앱 + 미들웨어
import { OpenAPIHono } from '@hono/zod-openapi'
import { logger } from 'hono/logger'
import { authIndex } from '~/routes/auth/index'
import { healthIndex } from '~/routes/health/health.index'
import { metricsIndex } from '~/routes/metrics/metrics.index'

const app = new OpenAPIHono()

app.use('*', logger())

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal Server Error' }, 500)
})

// Route mounting
app.route('/health', healthIndex)
app.route('/metrics', metricsIndex)
app.route('/auth', authIndex)

// OpenAPI document endpoint
app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'Fullstack Forge API',
    version: '1.0.0',
  },
})

export { app }
```

## src/lib/create-app.ts — Router Factory

```ts
import { OpenAPIHono } from '@hono/zod-openapi'
import type { AppBindings } from './types'

export function createRouter() {
  return new OpenAPIHono<{ Bindings: AppBindings }>()
}

export function createApp() {
  const app = new OpenAPIHono<{ Bindings: AppBindings }>()
  return app
}
```

## src/lib/types.ts — App Types

```ts
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { Redis } from 'ioredis'

export type AppBindings = {
  Variables: {
    user?: {
      id: string
      email: string
    }
    db: DrizzleD1Database
    redis: Redis
  }
}

export type AppEnv = {
  Bindings: AppBindings
}
```

## src/db/schema/ — Drizzle 스키마 (Domain별 분리)

스키마는 도메인별 파일로 분리하고 `index.ts`에서 barrel export한다.

```ts
// src/db/schema/index.ts
export * from './auth'
export * from './order'
export * from './review'
export * from './inquiry'
export * from './relations'
```

```ts
// src/db/schema/auth.ts
import { relations } from 'drizzle-orm'
import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const userCredentials = pgTable('user_credentials', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  passwordHash: text('password_hash').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const userOauthAccounts = pgTable('user_oauth_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(), // google | kakao
  providerUserId: text('provider_user_id').notNull(),
  email: text('email'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const userSessions = pgTable('user_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  refreshTokenHash: text('refresh_token_hash').notNull(),
  revoked: boolean('revoked').notNull().default(false),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  event: text('event').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const usersRelations = relations(users, ({ one, many }) => ({
  credentials: one(userCredentials, {
    fields: [users.id],
    references: [userCredentials.userId],
  }),
  sessions: many(userSessions),
  auditLogs: many(auditLogs),
}))
```

## routes/auth/ — 인증 라우트 (endpoint 폴더 패턴)

`apps/api/src/routes/auth/`가 auth 구조의 source of truth다.

```text
routes/auth/
├── index.ts
├── @shared/
│   ├── config/constants.ts
│   ├── http/{middleware.ts,service.ts,schemas.ts}
│   ├── security/{password.ts,rate-limit.ts}
│   └── session/{session.ts,tokens.ts}
├── signup/{schema.ts,route.ts,handler.ts,handler.test.ts}
├── login/{schema.ts,route.ts,handler.ts,account-lockout.ts,handler.test.ts}
├── refresh/{schema.ts,route.ts,handler.ts,handler.test.ts}
├── logout/{schema.ts,route.ts,handler.ts,handler.test.ts}
├── me/{schema.ts,route.ts,handler.ts,handler.test.ts}
└── oauth/
    ├── @shared/{schema.ts,service.ts,state.ts,providers/*}
    ├── start/{schema.ts,route.ts,handler.ts,handler.test.ts}
    └── callback/{schema.ts,route.ts,handler.ts,handler.test.ts}
```

핵심 조합은 `routes/auth/index.ts`에서 수행한다.

```ts
import { createRouter } from '~/lib/create-app'
import { loginHandler } from './login/handler'
import { loginRoute } from './login/route'
import { signupHandler } from './signup/handler'
import { signupRoute } from './signup/route'

export const authIndex = createRouter()

authIndex.openapi(signupRoute, signupHandler)
authIndex.openapi(loginRoute, loginHandler)
```

## 파일별 역할 컨벤션

| 파일                         | 역할               | 포함 내용                                                         | 포함하지 않는 것        |
| ---------------------------- | ------------------ | ----------------------------------------------------------------- | ----------------------- |
| `index.ts`                   | Router entry       | `createRouter()` + `openapi()` 호출로 endpoint route/handler 연결 | 비즈니스 로직           |
| `{endpoint}/route.ts`        | Route 정의         | `createRoute()` 정의 (method, path, request/response schema)      | Handler 구현            |
| `{endpoint}/handler.ts`      | Handler 구현       | HTTP 관심사 (request 파싱, response 포매팅, cookie/header)        | 무분별한 공통 로직 축적 |
| `{endpoint}/schema.ts`       | Zod 스키마         | endpoint request/response Zod 스키마                              | DB 스키마               |
| `@shared/service.ts`         | 비즈니스 로직      | 여러 endpoint가 공통으로 쓰는 DB/상태 전이/외부 호출              | 단일 endpoint 전용 로직 |
| `{endpoint}/handler.test.ts` | 테스트             | endpoint handler 테스트 (given/when/then)                         |                         |
| `@shared/middleware.ts`      | Auth 공유 미들웨어 | auth 내부에서 공통으로 쓰는 middleware                            | unrelated feature 로직  |

## Guardrails (명시적 규칙)

### G1. Anti-Abstraction Rule

- Handler → Service 직접 호출 (use-case 레이어 금지)
- Service → Drizzle 직접 호출 (repository 레이어 금지)
- 새 추상화 레이어 추가 시 ADR 작성 필수

### G2. File Naming Convention

- endpoint 디렉토리 + 역할 파일명 사용: `{endpoint}/schema.ts`, `{endpoint}/route.ts`, `{endpoint}/handler.ts`
- 이유: 파일명은 역할을, 디렉토리는 컨텍스트를 담당해 확장 시 충돌이 줄어듦
- OAuth도 동일: `oauth/start/*`, `oauth/callback/*`, 공통은 `oauth/@shared/*`

### G3. Sub-Module Creation Threshold

- 4+ 관련 route + 별도 스키마 → sub-directory 생성
- "나중에 커질 수 있으니까" → sub-directory 생성 금지
- OAuth는 auth의 sub-module (독립 인증 flow, 별도 provider)

### G4. Service File Scope

- `handler.ts`: HTTP 관심사 (request → service → response)
- shared `service.ts`: Business logic (DB, 상태 전이, 해싱, 외부 호출)
- shared service > 300줄: 목적별 모듈(`state.ts`, `providers/*`)로 분리
- 단일 endpoint 전용 로직은 해당 endpoint 폴더에 유지

### G5. Middleware Placement

- `middleware/`: 3+ feature에서 공유하는 cross-cutting middleware
- `{feature}.middleware.ts`: 해당 feature에서만 사용하는 middleware
- 1-2 feature에서만 사용: feature 내부에 둠

### G6. lib/ Directory Cap

- 4 파일 고정: `create-app.ts`, `types.ts`, `errors.ts`, `openapi.ts`
- 추가 파일은 다른 적절한 위치에 (`db/`, `middleware/`, `routes/`)
- "utils", "helpers", "common" 파일 금지

### G7. No Barrel in routes/

- `app.ts`가 각 `feature/index.ts`를 직접 import
- `routes/index.ts` barrel 금지 (명시적 import = 가독성 + tree-shaking)

### G8. Cross-Feature Imports

- Auth 정보: middleware context (`c.get('user')`) 통해 접근
- Feature 간 service import: 허용 (단, 순환 금지)
- 3+ feature가 공유하는 로직: `lib/` 추출 (G6 cap 내에서)

### G9. Nested Resources

- `/reviews/:id/comments` → `routes/reviews/` 내부 (parent feature)
- `/inquiries/:id/replies` → `routes/inquiries/` 내부
- 독립 lifecycle이 아닌 한 parent에 유지

## 새 라우트 모듈 추가 가이드 (Step-by-Step)

아래 순서를 그대로 따르면 새 API 추가/수정 시 구조 일관성을 유지할 수 있다.
새 기능 추가 시에도 동일한 8단계 체크리스트를 적용해 구조 일관성을 유지한다.

1. `routes/{feature}/{endpoint}/` 디렉토리 생성
2. `{endpoint}/schema.ts` 작성 (요청/응답 Zod 스키마)
3. `{endpoint}/route.ts` 작성 (`createRoute()` 정의)
4. `{endpoint}/handler.ts` 작성 (HTTP 관심사)
5. 공통 로직 필요 시 `routes/{feature}/@shared/*` 작성
6. `routes/{feature}/index.ts`에서 `openapi(route, handler)` 조합
7. `app.ts`에 `app.route('/{feature}', {feature}Index)` 추가
8. `{endpoint}/handler.test.ts` 작성

### 예시: orders 라우트 추가

```ts
// src/routes/orders/orders.schemas.ts
import { z } from '@hono/zod-openapi'

export const createOrderRequestSchema = z.object({
  storeId: z.string().uuid(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
    }),
  ),
})
```

```ts
// src/routes/orders/orders.routes.ts
import { createRoute } from '@hono/zod-openapi'
import { createOrderRequestSchema } from './orders.schemas'

export const createOrderRoute = createRoute({
  method: 'post',
  path: '/',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createOrderRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Created',
    },
  },
})
```

```ts
// src/routes/orders/orders.handlers.ts
import type { RouteHandler } from '@hono/zod-openapi'
import { createOrderRoute } from './orders.routes'
import { createOrder } from './orders.service'

export const createOrderHandler: RouteHandler<typeof createOrderRoute> = async (c) => {
  const payload = c.req.valid('json')
  const created = await createOrder(payload)
  return c.json(created, 201)
}
```

```ts
// src/routes/orders/orders.index.ts
import { createRouter } from '~/lib/create-app'
import { createOrderRoute } from './orders.routes'
import { createOrderHandler } from './orders.handlers'

const ordersIndex = createRouter()
ordersIndex.openapi(createOrderRoute, createOrderHandler)

export { ordersIndex }
```

```ts
// src/app.ts
import { ordersIndex } from '~/routes/orders/orders.index'

app.route('/orders', ordersIndex)
```

### Sub-module 생성 기준

- `orders/admin`처럼 별도 권한/흐름이 있고 route가 4개 이상이면 sub-module 생성
- route 수가 적고 lifecycle이 같으면 같은 feature 디렉토리에 유지

### service.ts 생략 기준

- 단순 조회/단순 생성 CRUD에서 business invariant가 없으면 handler에서 Drizzle 직접 호출 가능
- 상태 전이, 권한 분기, 외부 연동(이벤트 publish, OAuth, 캐시)이 있으면 `service.ts` 필수

## OAuth 소셜 로그인 워크플로 (Google, Kakao)

```text
GET /auth/oauth/:provider/start
  -> provider별 authorize URL 생성
  -> state/nonce 생성 후 Redis에 TTL 저장
  -> 302 redirect

GET /auth/oauth/:provider/callback?code=...&state=...
  -> state/nonce 검증
  -> provider token endpoint 호출
  -> provider userinfo 조회 (email/sub or id)
  -> users + user_oauth_accounts upsert
  -> app session 발급 (cookie)
  -> 302 redirect (/auth/callback/success)
```

필수 보안 규칙:

- `state`는 Redis에 단기 TTL로 저장 후 1회성 소비
- Open Redirect 방지를 위해 redirect target allowlist 적용
- provider 식별자는 `google`, `kakao`만 허용
- callback 실패 시 공통 에러 코드(`oauth_invalid_state`, `oauth_exchange_failed`)로 정규화

권장 라우트 요약:

- `GET /auth/oauth/google/start`
- `GET /auth/oauth/google/callback`
- `GET /auth/oauth/kakao/start`
- `GET /auth/oauth/kakao/callback`

## 리프레시 토큰 로테이션 워크플로

현재 예시 라우트는 학습용 mock 응답을 포함한다. 실제 학습 하네스에서는 아래 정책을 적용한다.

1. 로그인 시 access JWT(짧게) + refresh token(길게) 발급
2. refresh 호출 시 **기존 refresh token 즉시 폐기** + 새 토큰 발급
3. 폐기된 토큰 재사용 감지 시 해당 세션 family 전체 revoke
4. access는 JWT 서명/클레임으로 로컬 검증, refresh는 `user_sessions.revoked`/`expiresAt`로 서버 검증

권장 만료 예시:

- access token: 10~15분
- refresh token: 7~30일 (보안 우선이면 더 짧게)

```text
POST /auth/login
  -> create user_sessions row (refreshTokenHash, expiresAt)
  -> sign access JWT (exp 10~15m)

POST /auth/refresh
  -> verify current refresh token hash
  -> revoke current session row
  -> insert new session row
  -> sign new access JWT
  -> return new access/refresh pair
```

> 구현 시 token 원문 저장 금지. DB/캐시에는 hash만 저장한다.

## 인증 Rate Limiting 구현

Redis를 이용해 최소 2계층 제한을 둔다.

- 로그인 endpoint: `5 req / 15 min / IP`
- 일반 API: `100 req / min / user`
- OAuth start endpoint: `20 req / 15 min / IP`

예시 key 패턴:

- `ratelimit:login:<ip>`
- `ratelimit:oauth-start:<ip>`
- `ratelimit:api:<user-id>`

응답 가이드:

- 상태코드: `429`
- 헤더: `Retry-After` + 표준 `RateLimit-*` 헤더(`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`) 권장
- 하위 호환이 필요하면 `X-RateLimit-*`를 추가로 노출

간단 미들웨어 예시(개념):

```ts
app.use('/auth/login', async (c, next) => {
  const ip = c.req.header('x-forwarded-for') ?? 'local'
  // INCR + EXPIRE를 조합해 window를 구성 (실서비스는 Lua/원자 연산 권장)
  const key = `ratelimit:login:${ip}`
  const count = await redis.incr(key)
  if (count === 1) await redis.expire(key, 15 * 60)

  c.header('RateLimit-Limit', '5')
  c.header('RateLimit-Remaining', String(Math.max(0, 5 - count)))
  c.header('RateLimit-Reset', '900')

  if (count > 5) {
    c.header('Retry-After', '900')
    return c.json({ error: 'Too Many Requests' }, 429)
  }

  await next()
})
```

## drizzle.config.ts 기준안

```ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
})
```

## 마이그레이션 안전 수칙

- `db:generate` 후 생성 SQL 리뷰
- 적용 전 백업(로컬이라도 dump) 수행
- destructive 변경은 단계적(추가 -> 백필 -> 전환 -> 삭제)
- rollback SQL 또는 복구 절차를 PR 본문에 같이 기록

## 캐시 워크플로 (Redis)

```bash
# 1) Redis 실행
docker run --name repo-redis -p 6379:6379 -d redis:7-alpine

# 2) 백엔드 환경변수 설정
export REDIS_URL=redis://localhost:6379

# 3) revoke/nonce 캐시 확인
redis-cli KEYS "auth:denylist:*"
```

인증 관련 키 예시:

```text
auth:denylist:jti:<jwt-id>
auth:oauth:state:<state-id>
```

## 모니터링 워크플로 (Prometheus + Grafana)

```bash
curl http://localhost:8080/metrics
docker compose -f infra/monitoring/docker-compose.monitoring.yml up -d
# Grafana: http://localhost:3000 (admin / admin)
```

`infra/monitoring/docker-compose.monitoring.yml` 최소 예시:

> 아래 예시는 워크스페이스 루트 기준 경로를 전제로 한다.

```yaml
services:
  prometheus:
    image: prom/prometheus:v3.5.0
    ports: ['9090:9090']
    volumes:
      - ../prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro

  grafana:
    image: grafana/grafana:12.1.1
    ports: ['3000:3000']
```

Prometheus 스크레이프 최소 예시:

```yaml
scrape_configs:
  - job_name: repo-api
    static_configs:
      - targets: ['host.docker.internal:8080']
```

## Docker / Kubernetes

- Dockerfile 기반 컨테이너 빌드 + 런타임 실행
- `k8s/api-deployment.yaml`로 API 배포, `k8s/api-servicemonitor.yaml`로 `/metrics` 수집 연결

## 디렉토리 구조

```
apps/api/
├── Dockerfile
├── k8s/
│   ├── api-deployment.yaml
│   └── api-servicemonitor.yaml
├── drizzle/
├── src/
│   ├── app.ts                          # OpenAPIHono: global middleware + route mounting
│   ├── index.ts                        # @hono/node-server production entry
│   ├── env.ts                          # Zod env schema validation
│   │
│   ├── lib/                            # App infrastructure (4 files only)
│   │   ├── create-app.ts              # createRouter() / createApp() factories
│   │   ├── types.ts                   # AppBindings, AppEnv types
│   │   ├── errors.ts                  # HTTPException subclasses + onError handler
│   │   └── openapi.ts                 # OpenAPI doc + Swagger UI configuration
│   │
│   ├── middleware/                     # Shared middleware (3+ feature 공유)
│   │   ├── auth.ts                    # JWT verification, session check
│   │   ├── rate-limit.ts             # Redis-backed rate limiting
│   │   └── request-logger.ts         # Request logging
│   │
│   ├── db/                            # Database layer
│   │   ├── client.ts                  # Drizzle client instance
│   │   ├── schema/                    # Domain별 스키마 (barrel export)
│   │   │   ├── index.ts              # Re-export all schemas + relations
│   │   │   ├── auth.ts               # users, user_credentials, user_oauth_accounts, user_sessions
│   │   │   ├── review.ts             # reviews, review_comments
│   │   │   ├── inquiry.ts            # customer_inquiries, inquiry_replies
│   │   │   ├── order.ts              # orders, order_items (Stage 1+)
│   │   │   └── relations.ts          # All cross-domain relations
│   │   ├── seed.ts                    # Development seed data
│   │   └── migrate.ts                 # Migration runner
│   │
│   ├── cache/                         # Redis client
│   │   └── client.ts
│   │
│   ├── routes/                        # ★ API routes (domain-organized)
│   │   ├── health/
│   │   │   └── health.index.ts       # GET /health
│   │   │
│   │   ├── metrics/
│   │   │   └── metrics.index.ts      # GET /metrics (Prometheus)
│   │   │
│   │   ├── auth/                      # 인증 도메인 (source of truth)
│   │   │   ├── index.ts              # Router: mounts all auth endpoints
│   │   │   ├── @shared/
│   │   │   │   ├── audit/audit.ts
│   │   │   │   ├── config/constants.ts
│   │   │   │   ├── http/{middleware.ts,schemas.ts,service.ts}
│   │   │   │   ├── security/{password.ts,rate-limit.ts}
│   │   │   │   └── session/{session.ts,tokens.ts}
│   │   │   ├── signup/{schema.ts,route.ts,handler.ts,handler.test.ts}
│   │   │   ├── login/{schema.ts,route.ts,handler.ts,account-lockout.ts,handler.test.ts}
│   │   │   ├── refresh/{schema.ts,route.ts,handler.ts,handler.test.ts}
│   │   │   ├── logout/{schema.ts,route.ts,handler.ts,handler.test.ts}
│   │   │   ├── me/{schema.ts,route.ts,handler.ts,handler.test.ts}
│   │   │   └── oauth/
│   │   │       ├── @shared/{schema.ts,service.ts,state.ts,providers/*}
│   │   │       ├── start/{schema.ts,route.ts,handler.ts,handler.test.ts}
│   │   │       └── callback/{schema.ts,route.ts,handler.ts,handler.test.ts}
│   │   │
│   │   ├── orders/                    # 주문 도메인 (Stage 1+)
│   │   │   ├── orders.index.ts
│   │   │   ├── orders.routes.ts
│   │   │   ├── orders.handlers.ts
│   │   │   ├── orders.schemas.ts
│   │   │   ├── orders.service.ts
│   │   │   ├── orders.test.ts
│   │   │   └── orders.admin.routes.ts  # Admin operations
│   │   │
│   │   ├── reviews/                   # 리뷰 도메인 (Stage 1.5+)
│   │   │   ├── reviews.index.ts
│   │   │   ├── reviews.routes.ts
│   │   │   ├── reviews.handlers.ts
│   │   │   ├── reviews.schemas.ts
│   │   │   ├── reviews.service.ts
│   │   │   └── reviews.test.ts
│   │   │
│   │   └── inquiries/                 # 문의 도메인 (Stage 2+)
│   │       ├── inquiries.index.ts
│   │       ├── inquiries.routes.ts
│   │       ├── inquiries.handlers.ts
│   │       ├── inquiries.schemas.ts
│   │       ├── inquiries.service.ts
│   │       └── inquiries.test.ts
│   │
│   └── events/                        # Event infrastructure
│       ├── publisher.ts
│       └── envelope.ts
├── drizzle.config.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

확장 단계에서는 `apps/workers/*`(notifications, inventory, dispatch)로 분리 배포할 수 있게 유지한다.
