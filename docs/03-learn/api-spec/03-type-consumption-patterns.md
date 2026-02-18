# 03. 타입 소비 패턴

## 핵심 질문

> 생성된 OpenAPI 타입을 프론트엔드/백엔드에서 어떻게 안전하게 소비하는가?

## 한 줄 답

프론트는 `paths` 타입으로 요청/응답을 추출하고, 백엔드는 `components['schemas']`로 응답 계약을 고정한다.

---

## 프론트엔드 패턴 (`paths`)

```ts
import type { paths } from '@fullstack-forge/api-spec/types'

type MeResponse = paths['/auth/me']['get']['responses']['200']['content']['application/json']

type LoginRequest = paths['/auth/login']['post']['requestBody']['content']['application/json']
```

이 방식은 route schema가 바뀌면 typecheck에서 즉시 드러난다.

---

## 백엔드 패턴 (`components` + `satisfies`)

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

`satisfies`를 사용하면 응답 구조 위반이 컴파일 단계에서 잡힌다.

---

## 호출 계층 권장

- HTTP 클라이언트: `ky.create({ prefixUrl: '/api' })`
- 서버 상태: TanStack Query `queryOptions`
- 화면 소비: Suspense + ErrorBoundary 조합

---

## 이 프로젝트에서의 적용

| 결정                       | 해결하는 문제                       |
| -------------------------- | ----------------------------------- |
| `paths` 인덱스 접근        | 프론트 요청/응답 타입 드리프트 방지 |
| `components` + `satisfies` | 백엔드 응답 계약 위반 조기 검출     |
| codegen-first 루프         | 계약 변경 후 타입 반영 누락 방지    |

---

> 근거 문서: [architecture/integration/01-integration](../../02-architecture/integration/01-integration.md), [ADR-0003](../../02-architecture/integration/01-integration.adr.md)
