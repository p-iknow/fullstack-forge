# 05. Integration — 프론트-백엔드 연동

## api-spec 기준 타입 공유 전략

API 계약 기준은 `@fullstack-forge/api-spec` 패키지로 고정한다.
`apps/api`의 Hono route-level schema(`@hono/zod-openapi`)를 원천으로 OpenAPI/타입 산출물을 만들고,
프론트/백엔드는 `@fullstack-forge/api-spec`만 소비한다.

```
apps/api (Hono route schema: @hono/zod-openapi)
    │
    └── pnpm --filter @fullstack-forge/api-spec codegen
          │
          └── @fullstack-forge/api-spec
                ├── generated/openapi.yaml (git committed)
                ├── generated/types.ts (gitignored)
                ├── 프론트: paths/client SDK 소비 ──→ 타입 안전 API 호출
                ├── 백엔드: components['schemas'] 소비 ──→ 응답 계약 준수
                └── (향후) Kotlin/Go: openapi.yaml ──→ openapi-generator / oapi-codegen
```

## Fresh clone 기준 필수 순서

```bash
pnpm install
pnpm --filter @fullstack-forge/api-spec codegen
pnpm typecheck
```

`packages/api-spec/generated/types.ts`는 커밋 대상이 아니므로,
clone/branch 전환 후에는 codegen을 다시 실행해야 한다.

## 런타임 요청 흐름 (서비스 공통: 회원가입/로그인)

```text
Browser -> Vite Proxy (/api/*) -> Hono Route -> Drizzle -> PostgreSQL
```

## 런타임 요청 흐름 (OAuth: Google/Kakao)

```text
Browser -> /api/auth/oauth/:provider/start
  -> provider authorize redirect
  -> /api/auth/oauth/:provider/callback
     -> session 발급
     -> Browser(app) /auth/callback/success
```

## 런타임 요청 흐름 (앱 핵심 경로: 퀵커머스 주문)

```text
Browser -> Nginx (/api/orders)
  -> Hono Route (POST /orders)
    -> PostgreSQL (order write)
    -> SNS topic publish (OrderCreated)
      -> SQS fanout queues (notifications/inventory/dispatch)
        -> workers
          -> Redis idempotency + read model
```

권장 app 분리 관점:

- store(`store`): 주문 생성/조회, 내 주문 상태
- admin(`admin`): 주문 상태 전이, 운영 이벤트 재처리(redrive) 제어

## 운영 토폴로지 (확장)

```text
Ingress
  -> repo-api Service (K8s)
     -> repo-api Pod (Hono)
        -> PostgreSQL
        -> Redis

Prometheus Operator
  -> ServiceMonitor(repo-api)
     -> /metrics scrape
        -> Grafana dashboard + alerting

Event path (primary app flow)
  -> POST /orders
     -> SNS topic
        -> SQS fanout queues
           -> workers
              -> Redis idempotency key + DB side-effects
```

이벤트 중심 앱 구현은 [PRD 관측성](../../01-prd/14-observability/01-overview.md)을 기준으로 진행한다.

## 프론트 API 계층 권장 패턴

- Query Key는 도메인 네임스페이스를 포함해 안정적으로 구성 (`['auth', 'me']`, `['auth', 'session']`)
- ky 인스턴스는 `ky.create()`로 단일화하고 `prefixUrl`, `timeout`, `retry`, `hooks`를 중앙 관리
- 조회는 TanStack Query `queryOptions` 팩토리로 분리해 재사용
- 화면에서는 `@suspensive/react-query`의 `SuspenseQuery` 또는 TanStack Query suspense hook 사용
- 에러 처리는 `@suspensive/react` `ErrorBoundary`로 라우트 경계에서 일괄 처리

참고 문서:

- TanStack Query Suspense Guide: `https://tanstack.com/query/v5/docs/react/guides/suspense`
- TanStack Query useSuspenseQuery: `https://tanstack.com/query/v5/docs/react/reference/useSuspenseQuery`
- TanStack Query Query Keys: `https://tanstack.com/query/v5/docs/react/guides/query-keys`
- Suspensive React Query Docs: `https://suspensive.org/docs/react-query/why-suspensive-react-query`
- ky README: `https://github.com/sindresorhus/ky#readme`

### 기존(Hono RPC) 대비 차이

| 항목              | Hono RPC (제거됨)                 | zod-openapi code-first (신규)                              |
| ----------------- | --------------------------------- | ---------------------------------------------------------- |
| 타입 원천         | `typeof app` (TS 런타임에서 추론) | Hono route schema (`@hono/zod-openapi`)                    |
| 프론트 클라이언트 | `hc<AppType>('/api')`             | `ky.create({ prefixUrl: '/api' })` + `queryOptions`        |
| 프론트 deps       | `hono` (클라이언트 번들에 포함)   | `ky` + `@tanstack/react-query` + `@suspensive/react-query` |
| 백엔드 export     | `AppType` export 필수             | route schema + OpenAPI export                              |
| 이식성            | TypeScript only                   | OpenAPI → 모든 언어                                        |

## 프론트엔드 API 클라이언트

### src/lib/api-client.ts

```ts
import ky from 'ky'
import type { paths } from '@fullstack-forge/api-spec/types'

const api = ky.create({
  prefixUrl: '/api',
  timeout: 10000,
  retry: { limit: 2 },
})

type AuthMeResponse = paths['/auth/me']['get']['responses']['200']['content']['application/json']
type LoginBody = paths['/auth/login']['post']['requestBody']['content']['application/json']
type SignupBody = paths['/auth/signup']['post']['requestBody']['content']['application/json']

export const apiClient = {
  signup: async (body: SignupBody) => api.post('auth/signup', { json: body }).json(),
  login: async (body: LoginBody) => api.post('auth/login', { json: body }).json(),
  getMe: async () => api.get('auth/me').json<AuthMeResponse>(),
  oauthStartUrl: (provider: 'google' | 'kakao') => `/api/auth/oauth/${provider}/start`,
}
```

### 사용 예시 (회원 세션 조회)

```tsx
// src/queries/auth.ts
import { queryOptions } from '@tanstack/react-query'
import { apiClient } from '~/lib/api-client'

export const meQueryOptions = queryOptions({
  queryKey: ['auth', 'me'],
  queryFn: () => apiClient.getMe(),
  staleTime: 30_000,
})
```

```tsx
// src/routes/login.tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { SuspenseQuery } from '@suspensive/react-query'
import { apiClient } from '~/lib/api-client'
import { meQueryOptions } from '~/queries/auth'

const loginInput = { email: 'demo@example.com', password: 'Passw0rd!' }

export function AuthGate() {
  const queryClient = useQueryClient()

  const loginMutation = useMutation({
    mutationFn: () => apiClient.login(loginInput),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auth', 'me'] }),
  })

  return (
    <>
      <button onClick={() => loginMutation.mutate()}>Login</button>
      <SuspenseQuery {...meQueryOptions}>{({ data }) => <p>{data.user.email}</p>}</SuspenseQuery>
    </>
  )
}
```

```tsx
// src/routes/signup.tsx
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '~/lib/api-client'

export function SignupForm() {
  const signupMutation = useMutation({
    mutationFn: () =>
      apiClient.signup({
        email: 'new@example.com',
        password: 'Passw0rd!',
        name: 'New User',
      }),
  })

  return <button onClick={() => signupMutation.mutate()}>Sign up</button>
}
```

TanStack Query + Suspensive 타입/캐시 특성:

```ts
// ✅ paths 타입 기반 응답 추론
const data = await apiClient.getMe()
// data 타입: { user: { id: string; email: string; ... } }

// ✅ Query Key 기반 세션 캐시
const meQueryOptions = queryOptions({
  queryKey: ['auth', 'me'],
  queryFn: () => apiClient.getMe(),
})

// ✅ 로그인 성공 후 세션 무효화/재조회
queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })

// ✅ Suspense fallback + ErrorBoundary 조합 가능
// <ErrorBoundary><Suspense fallback={...}><AuthGate /></Suspense></ErrorBoundary>
```

## 백엔드 타입 소비

### 생성된 타입으로 응답 계약 준수

```ts
// apps/api/src/routes/auth/login/handler.ts
import type { components } from '@fullstack-forge/api-spec/types'

type LoginResponse = components['schemas']['LoginResponse']

export const loginHandler = (c: { json: (payload: LoginResponse) => Response }) => {
  return c.json({
    accessToken: 'jwt-token',
    user: { id: 'u_1', email: 'demo@example.com', name: 'Demo' },
  } satisfies LoginResponse)
}
```

## 목표 범위

- 퀵커머스 앱의 인증 + 주문 + 리뷰/문의 + 이벤트 경로를 하나의 연동 흐름으로 구축
- 최소 기능: `POST /auth/signup`, `POST /auth/login`, `GET /auth/me`, `GET /auth/oauth/:provider/start`, `GET /auth/oauth/:provider/callback`, `POST /orders`, `GET /orders/:id`, `POST /reviews`, `POST /reviews/:id/comments`, `POST /inquiries`, `GET /inquiries/:id`
- 이벤트 처리: `OrderCreated` fanout, worker 독립 처리, 상태 반영(read model), 리뷰/문의 운영 로그 연계

## Vite Dev Proxy

개발 시 프론트엔드 `/api/*` → `http://localhost:8080`으로 프록시.

```ts
// apps/store/vite.config.ts (이미 설정됨)
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    },
  },
},
```

프로덕션에서는 리버스 프록시(nginx 등) 또는 같은 도메인 배포로 대체.

## 의존성 연결

```jsonc
// apps/store/package.json
{
  "dependencies": {
    "@fullstack-forge/api-spec": "workspace:*",    // 생성된 타입 (paths, components)
    "ky": "catalog:",                    // HTTP 클라이언트
    "@tanstack/react-query": "catalog:", // 서버 상태 캐시
    "@suspensive/react": "catalog:",      // Suspense/ErrorBoundary
    "@suspensive/react-query": "catalog:" // Suspense 유틸
  }
}

// apps/api/package.json
{
  "dependencies": {
    "@hono/zod-openapi": "catalog:",
    "@hono/swagger-ui": "catalog:",
    "redis": "catalog:"                 // 조회 응답 캐시
  }
}
```

> 프론트는 `@fullstack-forge/api` (백엔드 패키지) 직접 의존하지 않음 — `@fullstack-forge/api-spec`만 참조.

## Codegen 워크플로

이 섹션을 `codegen 단일 기준`으로 사용한다.
다른 문서(02/06/07)의 codegen 안내가 간략할 경우, 여기 기준을 우선 적용한다.

### 수동 실행

```bash
# api-spec 패키지에서 codegen
pnpm --filter @fullstack-forge/api-spec codegen

# 또는 Nx를 통해 (모든 codegen 대상 실행)
pnpm exec nx run-many -t codegen
```

### 자동 실행

Nx `targetDefaults`에 의해 `build`, `typecheck` 실행 시 `codegen`이 선행:

```jsonc
// nx.json (01-foundation.md에 정의됨)
{
  "codegen": { "dependsOn": ["^codegen"], "cache": true },
  "build": { "dependsOn": ["codegen", "^build"], "cache": true },
  "typecheck": { "dependsOn": ["codegen", "^typecheck"], "cache": true },
}
```

실행 의미:

- `pnpm typecheck` -> `codegen` 선행 후 타입 검증
- `pnpm build` -> `codegen` 선행 후 빌드
- spec 수정 후에도 수동 `codegen`을 먼저 실행하면 IDE 피드백이 가장 안정적

### API 변경 워크플로

```
1. route schema 수정 (`apps/api/src/routes/**/route.ts` + 필요 시 `schema.ts`)
2. pnpm --filter @fullstack-forge/api-spec codegen
3. openapi.yaml 변경 확인 → git commit
4. types.ts 자동 재생성 → 프론트/백 타입 에러 확인
5. 프론트/백 코드 수정 → 전체 typecheck 통과
```

## 계약 검증 워크플로 (Contract Verification)

```text
route schema 변경
  -> codegen
  -> openapi.yaml diff 리뷰
  -> backend response/request 타입 검증
  -> frontend request/response 타입 검증
  -> typecheck + test
```

검증 체크:

- `pnpm --filter @fullstack-forge/api-spec codegen` 성공
- `git diff packages/api-spec/generated/openapi.yaml`에 의도한 변경만 존재
- `pnpm typecheck` 통과
- `pnpm test` 통과
- 샘플 API 호출(curl/브라우저) 동작

## Stale generated 대응

증상과 조치:

- `Cannot find module '@fullstack-forge/api-spec/types'`
  - `pnpm --filter @fullstack-forge/api-spec codegen`
- route schema를 바꿨는데 타입이 반영되지 않음
  - `pnpm --filter @fullstack-forge/api-spec codegen`
  - `pnpm exec nx reset`
- CI에서 openapi stale 실패
  - 로컬 codegen 실행 후 `openapi.yaml`만 커밋

## Dev 워크플로

```bash
# 터미널 1: codegen (최초 1회 또는 spec 변경 시)
pnpm --filter @fullstack-forge/api-spec codegen

# 터미널 2: 백엔드
pnpm --filter @fullstack-forge/api dev          # vite dev, port 8080

# 터미널 3: 프론트엔드
pnpm --filter @fullstack-forge/store dev        # vite dev, port 3001

# 또는 Nx로 동시 실행 (codegen → dev 순서 보장)
pnpm dev                              # nx run-many -t dev
```

브라우저에서 `http://localhost:3001/api/auth/me` → vite proxy → `http://localhost:8080/auth/me`.
