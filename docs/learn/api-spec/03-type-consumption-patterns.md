# 03. 타입 소비 패턴

## 핵심 질문

> 생성된 API 타입을 프론트엔드와 백엔드에서 어떻게 안전하게 소비하는가?

## 한 줄 답

프론트엔드는 **`paths` 타입으로 요청/응답을 추출**하고, 백엔드는 **`components['schemas']` 타입으로 응답 계약을 준수**한다. 두 쪽 모두 같은 `@fullstack-forge/api-spec/types`에서 import한다.

---

## 현재 접근 방식

```ts
// 프론트엔드 — paths 기반 요청/응답 타입 추출
import type { paths } from '@fullstack-forge/api-spec/types'
type MeResponse = paths['/auth/me']['get']['responses']['200']['content']['application/json']

// 백엔드 — components 기반 응답 계약 준수
import type { components } from '@fullstack-forge/api-spec/types'
type HealthResponse = components['schemas']['HealthResponse']
```

프론트/백이 동일한 생성 타입을 소비하되, 접근 방식이 다르다. 프론트는 경로(path) 중심, 백엔드는 스키마(schema) 중심.

---

## `paths` 타입 — 프론트엔드 요청/응답 타입 추출

**Problem** — API 호출 시 요청 body와 응답 타입을 수동으로 정의하면, 명세 변경 시 프론트엔드 타입이 뒤처진다. 특히 퀵커머스처럼 주문/리뷰/문의 등 API가 많아질수록 수동 타입 유지가 불가능해진다:

```ts
// 수동 타입 정의 — 명세와 드리프트 위험
interface ReviewCreateBody {
  orderItemId: string
  productId: string
  rating: number // ← 명세에서 int32로 바뀌면?
  content: string
}
```

**Action** — `openapi-typescript`가 생성한 `paths` 인터페이스에서 경로별 요청/응답 타입을 인덱스 접근으로 추출한다:

```ts
import type { paths } from '@fullstack-forge/api-spec/types'

// 응답 타입 추출
type MeResponse = paths['/auth/me']['get']['responses']['200']['content']['application/json']

// 요청 body 타입 추출
type ReviewCreateBody = paths['/reviews']['post']['requestBody']['content']['application/json']

// 경로 파라미터가 있는 API
type InquiryDetail =
  paths['/inquiries/{id}']['get']['responses']['200']['content']['application/json']
```

**Result** — 타입이 OpenAPI 명세에서 자동 파생되므로 드리프트가 불가능하다. 명세에서 필드가 추가/제거되면 `codegen` 후 TypeScript 컴파일러가 즉시 타입 에러를 표시한다.

> **Caveat**: `paths['/reviews']['post']['requestBody']['content']['application/json']` 같은 깊은 인덱스 접근이 장황하다. 타입 별칭(type alias)으로 추출하여 재사용하는 것이 관례. 헬퍼 유틸리티 타입을 만들어도 좋지만, 이 프로젝트에서는 명시적 인덱스 접근을 선호한다.

---

## `components['schemas']` — 백엔드 응답 계약 준수

**Problem** — 백엔드 핸들러가 응답 객체를 자유롭게 구성하면, 명세와 다른 형태의 JSON을 반환할 수 있다. TypeSpec에서 `status: "ok" | "error"`로 정의했는데, 핸들러가 `status: "healthy"`를 반환해도 런타임 에러만 나고 컴파일 타임에는 잡히지 않는다.

**Action** — 생성된 `components['schemas']` 타입을 가져와 `satisfies` 키워드로 응답 형태를 검증한다:

```ts
// apps/api/src/routes/health.ts
import { Hono } from 'hono'
import type { components } from '@fullstack-forge/api-spec/types'

type HealthResponse = components['schemas']['HealthResponse']

const healthRoute = new Hono()

healthRoute.get('/', (c) => {
  return c.json({
    status: 'ok',
  } satisfies HealthResponse)
  // ❌ { status: 'healthy' } satisfies HealthResponse → 컴파일 에러
})
```

**Result** — `satisfies`는 TypeScript 4.9+에서 지원하며, 타입 추론을 유지하면서 형태 호환을 검증한다. 백엔드 응답이 명세에서 벗어나면 `tsc`가 즉시 에러를 표시하여, 계약 위반을 배포 전에 잡는다.

---

## `ky` + `queryOptions` — 타입 안전 API 호출 패턴

**Problem** — HTTP 클라이언트가 생성 타입과 연결되지 않으면, 요청 URL 오타나 응답 타입 불일치를 컴파일 타임에 잡을 수 없다. 또한 서버 상태(server state)를 수동으로 관리하면 캐시 무효화, stale 데이터 처리 등이 복잡해진다.

**Action** — `ky`로 HTTP 클라이언트를 구성하고, `paths` 타입을 결합한 API 함수를 `queryOptions` 팩토리로 감싼다:

```ts
// src/lib/api-client.ts
import ky from 'ky'
import type { paths } from '@fullstack-forge/api-spec/types'

const api = ky.create({
  prefixUrl: '/api',
  timeout: 10000,
  retry: { limit: 2 },
})

type AuthMeResponse = paths['/auth/me']['get']['responses']['200']['content']['application/json']

export const apiClient = {
  getMe: async () => api.get('auth/me').json<AuthMeResponse>(),
}
```

```ts
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
// 컴포넌트에서 사용
import { SuspenseQuery } from '@suspensive/react-query'
import { meQueryOptions } from '~/queries/auth'

function AuthGate() {
  return <SuspenseQuery {...meQueryOptions}>{({ data }) => <p>{data.email}</p>}</SuspenseQuery>
}
```

**Result** — 요청 타입이 명세에서 파생되고, TanStack Query가 캐시/재검증/stale 처리를 담당하며, Suspensive가 선언적 Suspense/ErrorBoundary 패턴을 제공한다. 타입 안전성 + 서버 상태 관리 + 선언적 UI의 세 가지가 결합된 패턴.

> **Caveat**: `ky.get('auth/me').json<AuthMeResponse>()`에서 제네릭 파라미터는 런타임 검증이 아닌 컴파일 타임 단언이다. 백엔드가 실제로 다른 형태를 반환하면 런타임 에러가 발생한다. 이를 방지하기 위해 백엔드 측에서 `satisfies`로 응답 계약을 준수하는 것이 전제 조건이다.

---

## Hono RPC 대비 이점 — spec-first 전환 근거

**Problem** — Hono RPC(`hc<AppType>`)는 백엔드 `typeof app`에서 타입을 추론하는 code-first 방식이다. 편리하지만 세 가지 한계가 있다:

1. `hono` 패키지가 프론트엔드 번들에 포함된다
2. 백엔드 구현이 곧 계약이므로 TypeScript 외 언어로 확장 불가
3. 백엔드 리팩토링이 곧 계약 변경이 되어 의도 파악이 어렵다

**Action** — spec-first로 전환하면 프론트/백 의존성이 분리된다:

| 항목              | Hono RPC (code-first)             | TypeSpec spec-first                                        |
| ----------------- | --------------------------------- | ---------------------------------------------------------- |
| 타입 원천         | `typeof app` (TS 런타임에서 추론) | `.tsp` 소스 (언어 무관 명세)                               |
| 프론트 클라이언트 | `hc<AppType>('/api')`             | `ky.create({ prefixUrl: '/api' })` + `queryOptions`        |
| 프론트 deps       | `hono` (클라이언트 번들에 포함)   | `ky` + `@tanstack/react-query` + `@suspensive/react-query` |
| 이식성            | TypeScript only                   | OpenAPI -> 모든 언어                                       |

**Result** — 프론트엔드 번들에서 `hono` 의존이 제거되고, 향후 Kotlin/Go 클라이언트도 `openapi.yaml`에서 생성할 수 있다. 계약 변경이 `.tsp` 파일 수정 + `openapi.yaml` diff로만 추적되어 리뷰 품질이 향상된다.

---

## 이 프로젝트에서의 적용

| 결정                       | 해결하는 문제                                                |
| -------------------------- | ------------------------------------------------------------ |
| `paths` 타입 인덱스 접근   | 프론트엔드 요청/응답 타입의 명세 드리프트 구조적 차단        |
| `components` + `satisfies` | 백엔드 응답의 계약 위반을 컴파일 타임에 검출                 |
| `ky` + `queryOptions`      | 타입 안전 HTTP 호출 + 서버 상태 캐시/재검증 자동화           |
| spec-first 전환            | 프론트 번들 경량화, 다국어 클라이언트 확장, 계약 리뷰 가시성 |

---

> **근거 문서**: [ADR-0003: API 계약을 TypeSpec -> OpenAPI로 관리](../../adr/ADR-0003-contract-first-typespec-openapi.md)

---
