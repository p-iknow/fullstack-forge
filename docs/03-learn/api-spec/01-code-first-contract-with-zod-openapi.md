# 01. Code-First 계약 원칙 (zod-openapi)

## 핵심 질문

> 왜 이 프로젝트는 TypeSpec이 아니라 Hono route schema(code-first)를 계약 기준으로 쓰는가?

## 한 줄 답

**구현 코드와 계약(schema)을 같은 위치에 두면 변경 추적이 단순해지고, 계약 드리프트를 줄일 수 있다.**

---

## 기준 결정

ADR-0003의 현재 상태는 다음과 같다.

- API 계약 기준: `@hono/zod-openapi`
- 계약 변경 시작점: route의 request/response schema
- 산출물: OpenAPI + 타입 생성물

즉, 이 프로젝트의 SSOT는 `apps/api/src/routes/**/route.ts`와 `**/schema.ts`다.

---

## 구조적 이점

1. **변경 가시성**
   - route와 schema가 co-locate되어 어떤 API가 바뀌는지 즉시 보인다.
2. **검증 일관성**
   - zod 검증 규칙과 OpenAPI 문서가 같은 원천에서 나온다.
3. **개발 속도**
   - 구현 중 schema를 바로 수정하고 타입/문서를 동기화할 수 있다.

---

## 최소 패턴

```ts
// routes/auth/login/route.ts
import { createRoute, z } from '@hono/zod-openapi'

export const loginRoute = createRoute({
  method: 'post',
  path: '/login',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({ email: z.string().email(), password: z.string().min(8) }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Success' },
  },
})
```

```ts
// app.ts
import { OpenAPIHono } from '@hono/zod-openapi'

const app = new OpenAPIHono()
app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: { title: 'Fullstack Forge API', version: '1.0.0' },
})
```

---

## 이 프로젝트에서의 적용

| 결정                              | 해결하는 문제                                       |
| --------------------------------- | --------------------------------------------------- |
| route schema를 계약 원천으로 사용 | 구현/문서/타입이 분리되어 생기는 드리프트 방지      |
| `createRoute()` + `OpenAPIHono`   | 타입 안전한 요청/응답 계약과 OpenAPI 산출 동시 달성 |

---

> 근거 문서: [ADR-0003](../../02-architecture/integration/01-integration.adr.md), [architecture/backend/01-backend](../../02-architecture/backend/01-backend.md)
