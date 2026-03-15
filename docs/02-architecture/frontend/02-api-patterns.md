# 02. API 호출 패턴 — Generated Client + Query Layer

> **요약**: `@hey-api/openapi-ts`로 생성된 SDK 함수/타입/Query Key를 활용하되, queryOptions/mutationOptions는 앱 정책(에러 처리, 캐시, SSR)이 필요하므로 직접 작성한다.
> **관련**: [01-frontend.md](./01-frontend.md), [frontend-error-handling 스킬](../../../.claude/skills/frontend-error-handling/SKILL.md)

---

## 1. 클라이언트 계층 구조

```
packages/api-spec/generated/     ← codegen 산출물 (수정 금지)
  client/{domain}/
    ├── client.gen.ts            ← ky 기반 HTTP 클라이언트 (createClient)
    ├── sdk.gen.ts               ← SDK 함수 (getAuthMe, postAuthLogin, …)
    ├── types.gen.ts             ← 요청/응답 타입
    └── @tanstack/
        └── react-query.gen.ts   ← queryOptions / mutationOptions (generated)

apps/{app}/src/@shared/
  api/
    ├── core.ts                  ← ApiClientError, readApiError (에러 유틸)
    ├── generated-client.ts      ← generated client 인스턴스 설정 (baseUrl, credentials, timeout)
    └── index.ts                 ← api 모듈 공개 API
  queries/
    └── {domain}.ts              ← 앱 정책이 적용된 queryOptions / mutationOptions
```

### 데이터 흐름

```
UI (useQuery/useMutation)
  → queries/{domain}.ts          앱 정책 (에러 래핑, staleTime, initialData)
    → sdk.gen.ts                 generated SDK 함수 (getAuthMe, postAuthLogin)
      → client.gen.ts            ky 기반 HTTP 요청
```

---

## 2. Generated Code 활용 범위

### 사용하는 것

| 산출물          | 용도                             | import 경로                                                           |
| --------------- | -------------------------------- | --------------------------------------------------------------------- |
| SDK 함수        | HTTP 호출 실행                   | `@fullstack-forge/api-spec/client/{domain}/sdk.gen`                   |
| 타입            | 요청/응답 타입 정의              | `@fullstack-forge/api-spec/client/{domain}/types.gen`                 |
| Query Key       | 캐시 키 생성                     | `@fullstack-forge/api-spec/client/{domain}/@tanstack/react-query.gen` |
| Client 인스턴스 | HTTP 설정 (baseUrl, credentials) | `@fullstack-forge/api-spec/client/{domain}/client.gen`                |

### 사용하지 않는 것

| 산출물                     | 미사용 이유                                            |
| -------------------------- | ------------------------------------------------------ |
| `getAuthMeOptions()`       | `throwOnError: true` 고정 — 앱의 에러 제어 전략과 충돌 |
| `postAuthLoginMutation()`  | `mutationKey` 미포함, 에러 래핑 불가                   |
| `postAuthSignupMutation()` | 동일                                                   |
| `postAuthLogoutMutation()` | 동일                                                   |

---

## 3. Generated queryOptions를 직접 사용하지 않는 이유

### 핵심: `throwOnError` 전략 차이

Generated 코드는 `throwOnError: true`로 고정되어 있어, SDK 에러가 그대로 throw된다.
앱에서는 `throwOnError: false`로 설정하고 응답을 수동 검사하여 `ApiClientError`로 래핑한다.

```typescript
// ❌ Generated — throwOnError: true 고정, 에러 제어 불가
export const getAuthMeOptions = (options?) =>
  queryOptions({
    queryFn: async ({ queryKey, signal }) => {
      const { data } = await getAuthMe({
        ...options,
        throwOnError: true, // ← 에러 시 무조건 throw
      })
      return data
    },
    queryKey: getAuthMeQueryKey(options),
  })

// ✅ Hand-written — throwOnError: false, 응답 기반 분기
export const meQueryOptions = (initialData?) =>
  queryOptions({
    queryFn: async () => {
      const { data, error, response } = await getAuthMe({
        client: authClient,
        throwOnError: false, // ← 에러를 값으로 받아 분기
      })

      if (response.status === 401) return null // 미인증 = 정상 상태
      if (!data || error) throw new ApiClientError({ error: 'Failed to load session' })

      return data
    },
    queryKey: authQueryKeys.me,
    staleTime: 30_000,
    retry: false,
    ...(initialData === undefined ? {} : { initialData }),
  })
```

### 앱 정책이 추가하는 가치

| 앱 정책                       | Generated에 없는 이유                                                    | 구현 위치                                             |
| ----------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------- |
| **401 → null**                | 미인증은 에러가 아닌 상태값. codegen은 HTTP 상태 코드별 분기를 모름      | `meQueryOptions`                                      |
| **ApiClientError 래핑**       | UI에서 일관된 에러 처리를 위한 앱 레벨 관심사                            | 모든 mutation/query                                   |
| **staleTime / retry**         | 도메인별 캐시 전략은 앱이 결정                                           | `meQueryOptions`                                      |
| **initialData (cookie 기반)** | SSR 최적화로 codegen 범위 밖                                             | `meQueryOptions` + `resolveMeInitialDataFromAuthHint` |
| **mutationKey**               | query invalidation 패턴에 필요하나 generated mutation에는 없음           | `loginMutationOptions` 등                             |
| **타입 alias**                | `NonNullable<PostAuthLoginData['body']>` → `LoginInput` 으로 가독성 확보 | queries 파일 상단                                     |

---

## 4. 올바른 패턴

### 새 도메인 query 추가 시

```typescript
// apps/store/src/@shared/queries/orders.ts

import { queryOptions, mutationOptions } from '@tanstack/react-query'
// 1. Generated에서: SDK 함수, 타입, Query Key
import { getOrdersQueryKey } from '@fullstack-forge/api-spec/client/store/@tanstack/react-query.gen'
import { getOrders, postOrders } from '@fullstack-forge/api-spec/client/store/sdk.gen'
import type {
  GetOrdersResponse,
  PostOrdersData,
  PostOrdersResponse,
} from '@fullstack-forge/api-spec/client/store/types.gen'
// 2. 앱 레벨: 에러 유틸, 클라이언트 인스턴스
import { ApiClientError } from '~/@shared/api/core'
import { storeClient } from '~/@shared/api/generated-client'

// 3. 타입 alias로 가독성 확보
export type CreateOrderInput = NonNullable<PostOrdersData['body']>
export type OrdersResponse = GetOrdersResponse

// 4. Query key를 generated 키 기반으로 구성
const generatedOrdersQueryKey = getOrdersQueryKey({ client: storeClient })

export const orderQueryKeys = {
  list: generatedOrdersQueryKey,
  create: ['orders', 'create'] as const,
}

// 5. queryOptions — 앱 정책 적용
export const ordersQueryOptions = () =>
  queryOptions({
    queryKey: orderQueryKeys.list,
    queryFn: async () => {
      const { data, error } = await getOrders({
        client: storeClient,
        throwOnError: false,
      })
      if (!data || error) {
        throw new ApiClientError({ error: 'Failed to load orders' })
      }
      return data
    },
    staleTime: 10_000,
  })

// 6. mutationOptions — mutationKey 포함, 에러 래핑
export const createOrderMutationOptions = () =>
  mutationOptions({
    mutationKey: orderQueryKeys.create,
    mutationFn: async (input: CreateOrderInput) => {
      const { data, error } = await postOrders({
        body: input,
        client: storeClient,
        throwOnError: false,
      })
      if (!data || error) {
        throw new ApiClientError({ error: 'Failed to create order' })
      }
      return data
    },
  })
```

### Generated client 인스턴스 설정

```typescript
// apps/store/src/@shared/api/generated-client.ts
import { client } from '@fullstack-forge/api-spec/client/auth/client.gen'

client.setConfig({
  baseUrl: '/api',
  credentials: 'include',
  timeout: 10_000,
  retry: { limit: 1 },
})

export const authClient = client
```

도메인이 여러 개일 경우 각 client 인스턴스를 별도로 설정한다:

```typescript
import { client as authClientInstance } from '@fullstack-forge/api-spec/client/auth/client.gen'
import { client as adminClientInstance } from '@fullstack-forge/api-spec/client/admin/client.gen'

const clientConfig = {
  baseUrl: '/api' as const,
  credentials: 'include' as const,
  timeout: 10_000,
  retry: { limit: 1 },
} as const

authClientInstance.setConfig(clientConfig)
adminClientInstance.setConfig(clientConfig)

export const authClient = authClientInstance
export const adminClient = adminClientInstance
```

---

## 5. 안티패턴

```typescript
// ❌ Generated queryOptions를 spread해서 override — queryFn을 통째로 바꿔야 하므로 의미 없음
export const meQueryOptions = () => ({
  ...getAuthMeOptions({ client: authClient }),
  queryFn: async () => {
    /* 전혀 다른 로직 */
  },
  staleTime: 30_000,
})

// ❌ throwOnError: true로 사용하면서 try/catch로 감싸기 — 에러 타입이 unknown
export const meQueryOptions = () =>
  queryOptions({
    queryFn: async () => {
      try {
        return await getAuthMe({ client: authClient, throwOnError: true })
      } catch (e) {
        // e는 unknown — 에러 구조를 보장할 수 없음
      }
    },
  })

// ❌ SDK 함수를 거치지 않고 직접 fetch — generated client의 interceptor/retry가 무시됨
export const meQueryOptions = () =>
  queryOptions({
    queryFn: () => fetch('/api/auth/me').then((r) => r.json()),
  })

// ❌ 에러를 무시하고 data만 반환 — 실패 시 undefined가 되어 런타임 에러
export const loginMutationOptions = () =>
  mutationOptions({
    mutationFn: async (input: LoginInput) => {
      const { data } = await postAuthLogin({ body: input, client: authClient })
      return data // error 체크 없음
    },
  })
```

---

## 6. 요약 — 각 레이어의 역할

| 레이어                | 파일                  | 역할                                          | 수정 가능 여부             |
| --------------------- | --------------------- | --------------------------------------------- | -------------------------- |
| **Generated Client**  | `client.gen.ts`       | ky 기반 HTTP 전송, interceptor, retry         | codegen 설정으로만 변경    |
| **Generated SDK**     | `sdk.gen.ts`          | 엔드포인트별 타입 안전 함수                   | codegen 산출물 (수정 금지) |
| **Generated Query**   | `react-query.gen.ts`  | 기본 queryOptions/mutationOptions, Query Key  | codegen 산출물 (수정 금지) |
| **App Client Config** | `generated-client.ts` | baseUrl, credentials, timeout 설정            | 앱별 설정                  |
| **App Error Utils**   | `core.ts`             | ApiClientError, readApiError                  | 앱 공통                    |
| **App Query Layer**   | `queries/{domain}.ts` | 앱 정책이 적용된 queryOptions/mutationOptions | **주요 편집 대상**         |
