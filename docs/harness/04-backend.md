# 04. Backend — apps/api 계층

`fullstack-forge`의 백엔드 기준: **퀵커머스 주문-배송 앱 구현**을 위한 API 골격(Hono + Drizzle ORM + PostgreSQL + Redis). Node.js 런타임.
인증(auth)은 공통 기초 단계이며, 이후 주문/리뷰/문의/이벤트/워커로 확장한다.

## 결정사항

| 항목           | 결정                               | 근거                                       |
| -------------- | ---------------------------------- | ------------------------------------------ |
| 런타임         | Node.js (`@hono/node-server`)      | 안정성 우선                                |
| 웹 프레임워크  | Hono                               | 작고 타입 친화적인 라우팅                  |
| ORM            | Drizzle ORM                        | SQL 가시성 + 타입 안전 스키마              |
| DB             | PostgreSQL                         | 운영 검증된 관계형 DB                      |
| 캐시           | Redis                              | 세션/리프레시 토큰/인증 rate-limit 캐시    |
| 메트릭         | Prometheus + Grafana               | `/metrics` 스크레이프 기반 관측            |
| 컨테이너       | Docker                             | 로컬/CI 환경 일관성                        |
| 오케스트레이션 | Kubernetes                         | 확장/롤링 배포/자가복구                    |
| 마이그레이션   | drizzle-kit                        | schema.ts 기반 DDL 생성/적용               |
| Dev 서버       | `vite` (@hono/vite-dev-server)     | HMR, Vite 기반 백엔드 dev 서버             |
| Prod 빌드      | `vite build` (@hono/vite-build)    | Node.js 타겟 프로덕션 번들                 |
| 포트           | 8080                               | 프론트 3000번대와 구분                     |
| 경로 별칭      | `~/` → `./src/`                    | 프론트 앱과 동일 컨벤션                    |
| 로그인 채널    | Email + Google OAuth + Kakao OAuth | 사용자 진입 경로 다양화 + 소셜 간편 로그인 |

## 목표 범위

- Stage 0 기초: `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- Stage 0.5 인증 확장: `GET /auth/oauth/:provider/start`, `GET /auth/oauth/:provider/callback` (`provider`: `google|kakao`)
- Stage 1+ 확장: `POST /orders`, `GET /orders/:id`, `OrderCreated` publish
- Stage 1.5+ 확장: `POST /reviews`, `PATCH /reviews/:id`, `POST /reviews/:id/comments`
- Stage 2+ 확장: `POST /inquiries`, `GET /inquiries/:id`, `POST /inquiries/:id/replies`, `PATCH /inquiries/:id`
- Stage 3+ 확장: notifications/inventory/dispatch worker + idempotency + DLQ/redrive

주문/이벤트 운영 기준은 `docs/roadmap/06-observability-and-reliability.md`, `docs/roadmap/07-admin-and-operations.md`를 기준으로 동기화한다.

## 백엔드 구조 원칙 (커머스 기준)

- 단일 배포 단위(`apps/api`)로 시작하되, 내부는 도메인 경계로 분리
- API surface 분리: store 요청과 admin 요청의 라우트/권한을 분리
- 비동기 후처리는 worker 경계로 분리 가능한 형태로 설계

권장 내부 경계:

- `surfaces/store/*`: 고객용 API
- `surfaces/admin/*`: 운영자용 API
- `modules/orders|reviews|inquiries|inventory|dispatch|auth/*`: 도메인 로직
- `integrations/oauth/*`: Google/Kakao provider 어댑터
- `events/*`: publish/consume 계약과 idempotency 유틸

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
    "@fullstack-forge/api-spec": "workspace:*",
    "hono": "catalog:",
    "@hono/node-server": "catalog:",
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

## src/app.ts — Hono 앱 + 미들웨어

```ts
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { authRoute } from '~/routes/auth'
import { healthRoute } from '~/routes/health'
import { metricsRoute } from '~/routes/metrics'

const app = new Hono()

app.use('*', logger())

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal Server Error' }, 500)
})

app.route('/health', healthRoute)
app.route('/metrics', metricsRoute)
app.route('/auth', authRoute)

export { app }
```

## src/db/schema.ts — Drizzle 스키마

```ts
import { relations } from 'drizzle-orm'
import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

const userCredentials = pgTable('user_credentials', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  passwordHash: text('password_hash').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

const userOauthAccounts = pgTable('user_oauth_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(), // google | kakao
  providerUserId: text('provider_user_id').notNull(),
  email: text('email'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

const userSessions = pgTable('user_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  refreshTokenHash: text('refresh_token_hash').notNull(),
  revoked: boolean('revoked').notNull().default(false),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  event: text('event').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

const usersRelations = relations(users, ({ one, many }) => ({
  credentials: one(userCredentials, {
    fields: [users.id],
    references: [userCredentials.userId],
  }),
  sessions: many(userSessions),
  auditLogs: many(auditLogs),
}))

export { auditLogs, userCredentials, userOauthAccounts, userSessions, users, usersRelations }
```

## src/routes/auth.ts — 회원가입/로그인 라우트

```ts
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '~/db/client'
import { users } from '~/db/schema'

const authRoute = new Hono()

authRoute.post('/signup', async (c) => {
  const payload = await c.req.json<{ email: string; password: string; name: string }>()

  const [created] = await db
    .insert(users)
    .values({ email: payload.email, name: payload.name })
    .returning({ id: users.id, email: users.email, name: users.name })

  return c.json({ user: created }, 201)
})

authRoute.post('/login', async (c) => {
  const payload = await c.req.json<{ email: string; password: string }>()
  const user = await db.query.users.findFirst({ where: eq(users.email, payload.email) })

  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  return c.json({
    accessToken: 'jwt-token',
    refreshToken: 'refresh-token',
    user: { id: user.id, email: user.email, name: user.name },
  })
})

authRoute.post('/logout', async (c) => {
  return c.json({ ok: true })
})

authRoute.get('/me', async (c) => {
  return c.json({
    user: { id: 'u_1', email: 'demo@example.com', name: 'Demo User' },
  })
})

export { authRoute }
```

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

1. 로그인 시 access token(짧게) + refresh token(길게) 발급
2. refresh 호출 시 **기존 refresh token 즉시 폐기** + 새 토큰 발급
3. 폐기된 토큰 재사용 감지 시 해당 세션 family 전체 revoke
4. `user_sessions.revoked`/`expiresAt` 기준으로 서버 측 검증

권장 만료 예시:

- access token: 10~15분
- refresh token: 7~30일 (보안 우선이면 더 짧게)

```text
POST /auth/login
  -> create user_sessions row (refreshTokenHash, expiresAt)

POST /auth/refresh
  -> verify current refresh token hash
  -> revoke current session row
  -> insert new session row
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
  schema: './src/db/schema.ts',
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

# 3) 세션 캐시 확인
redis-cli GET auth:session:u_1
```

세션 키 예시:

```text
auth:session:<session-id>
auth:user-sessions:<user-id>
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
│   ├── cache/
│   │   └── client.ts
│   ├── db/
│   │   ├── client.ts
│   │   └── schema.ts           # users/sessions/reviews/inquiries schema
│   ├── surfaces/
│   │   ├── store/               # 고객용 라우트
│   │   └── admin/               # 운영용 라우트
│   ├── modules/
│   │   ├── auth/
│   │   ├── orders/
│   │   ├── reviews/
│   │   ├── inquiries/
│   │   ├── inventory/
│   │   └── dispatch/
│   ├── integrations/
│   │   └── oauth/               # google/kakao adapter
│   ├── events/
│   │   ├── publisher.ts
│   │   └── envelope.ts
│   ├── monitoring/
│   │   └── metrics.ts
│   ├── routes/
│   │   ├── auth.ts             # POST /auth/signup, POST /auth/login, POST /auth/logout, GET /auth/me
│   │   ├── reviews.ts          # POST /reviews, PATCH /reviews/:id, POST /reviews/:id/comments
│   │   ├── inquiries.ts        # POST /inquiries, GET /inquiries/:id, POST /inquiries/:id/replies
│   │   ├── health.ts
│   │   └── metrics.ts
│   ├── app.ts
│   └── index.ts
├── drizzle.config.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

확장 단계에서는 `apps/workers/*`(notifications, inventory, dispatch)로 분리 배포할 수 있게 유지한다.
