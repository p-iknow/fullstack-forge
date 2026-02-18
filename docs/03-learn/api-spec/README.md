# API 계약(zod-openapi code-first) 심층 분석

이 프로젝트의 API 계약 흐름을 `@hono/zod-openapi` 기준으로 정리한다.
핵심은 **Hono route schema를 단일 계약 원천으로 사용**하고,
OpenAPI/타입 생성물을 프론트와 백엔드가 함께 소비하는 것이다.

> 기준 환경: `@hono/zod-openapi` · OpenAPI 3.1 · openapi-typescript · pnpm workspaces · Nx

## 문서 순서

| #   | 문서                                                                         | 핵심 질문                                               |
| --- | ---------------------------------------------------------------------------- | ------------------------------------------------------- |
| 01  | [Code-First 계약 원칙](./01-code-first-contract-with-zod-openapi.md)         | 왜 route schema를 계약의 기준으로 두는가?               |
| 02  | [OpenAPI/타입 생성 파이프라인](./02-openapi-and-type-generation-pipeline.md) | route schema 변경이 어떻게 OpenAPI/타입으로 전파되는가? |
| 03  | [타입 소비 패턴](./03-type-consumption-patterns.md)                          | 생성 타입을 프론트/백에서 어떻게 안전하게 소비하는가?   |

## 전제 지식

- TypeScript 기본 문법 (제네릭, 인덱스 접근 타입)
- REST API와 OpenAPI 스키마 개념
- `package.json`의 `exports` 필드 이해

## 이 프로젝트의 기준 구조

```text
apps/api/src/
├── app.ts                               ← OpenAPIHono + app.route(...) + app.doc(...)
└── routes/
    └── {feature}/
        ├── {feature}.routes.ts          ← createRoute() 정의
        ├── {feature}.handlers.ts        ← handler 구현
        ├── {feature}.schemas.ts         ← zod 스키마
        └── {feature}.index.ts           ← route mount entry

packages/api-spec/
└── generated/
    ├── openapi.yaml                     ← git committed
    └── types.ts                         ← generated type output
```

## 연관 문서

- 패키지 레시피: [architecture/base/03-packages](../../02-architecture/base/03-packages.md)
- 연동 표준: [architecture/integration/01-integration](../../02-architecture/integration/01-integration.md)
- 구현 표준 전체: [architecture/base/01-overview](../../02-architecture/base/01-overview.md)
- 백엔드 구조 기준: [architecture/backend/01-backend](../../02-architecture/backend/01-backend.md)
