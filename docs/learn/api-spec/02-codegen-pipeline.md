# 02. Codegen 파이프라인

## 핵심 질문

> TypeSpec에서 작성한 명세가 어떻게 프론트/백 타입으로 변환되는가?

## 한 줄 답

**`tsp compile`로 OpenAPI YAML을 생성하고, `openapi-typescript`로 TypeScript 타입을 생성한다.** Nx `dependsOn`이 이 순서를 빌드/타입체크 전에 자동 보장한다.

---

## 현재 흐름

```
main.tsp (TypeSpec 소스)
    │
    ├── tsp compile ──→ openapi.yaml  (git committed)
    │                       │
    │                       └── openapi-typescript ──→ types.ts (gitignored)
    │
    ├── 프론트: import type { paths } from '@fullstack-forge/api-spec/types'
    └── 백엔드: import type { components } from '@fullstack-forge/api-spec/types'
```

두 단계 codegen이 하나의 `codegen` 스크립트로 연결된다:

```bash
# packages/api-spec/package.json scripts.codegen
tsp compile src/main.tsp --emit @typespec/openapi3 && openapi-typescript generated/openapi.yaml -o generated/types.ts
```

---

## `tsp compile` — TypeSpec에서 OpenAPI 3.1 생성

**Problem** — API 명세를 수동으로 관리하면 TypeSpec 소스와 OpenAPI 산출물 사이에 불일치가 발생할 수 있다. DSL에서 모델을 수정했는데 OpenAPI에 반영되지 않으면, 프론트/백이 서로 다른 계약을 보게 된다.

**Action** — `tsp compile`은 TypeSpec 소스를 파싱하여 OpenAPI 3.1 YAML을 생성한다. `tspconfig.yaml`에서 emitter와 출력 경로를 설정한다:

```yaml
# packages/api-spec/tspconfig.yaml
emit:
  - '@typespec/openapi3'
options:
  '@typespec/openapi3':
    output-file: openapi.yaml
    emitter-output-dir: '{project-root}/generated'
```

TypeSpec 소스가 컴파일되면 `generated/openapi.yaml`이 생성된다:

```typespec
// src/main.tsp 입력
model HealthResponse {
  status: "ok" | "error";
}

@route("/health")
namespace Health {
  @get op check(): HealthResponse;
}
```

```yaml
# generated/openapi.yaml 출력
openapi: 3.1.0
info:
  title: Repo API
  version: 0.0.0
paths:
  /health:
    get:
      operationId: Health_check
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthResponse'
components:
  schemas:
    HealthResponse:
      type: object
      required: [status]
      properties:
        status:
          type: string
          enum: [ok, error]
```

**Result** — TypeSpec 소스 변경 시 `tsp compile`만 실행하면 OpenAPI 명세가 항상 동기화된다. `tsp compile --no-emit`으로 출력 없이 문법 검증만도 가능하며, 이 프로젝트에서는 `typecheck` 스크립트가 이 용도로 사용된다.

---

## `openapi-typescript` — OpenAPI에서 TypeScript 타입 생성

**Problem** — OpenAPI YAML은 언어에 무관한 계약이지만, TypeScript 프로젝트에서 직접 사용할 수 없다. 수동으로 타입을 작성하면 OpenAPI 명세와 TS 타입 사이에 드리프트가 발생한다.

**Action** — `openapi-typescript`가 OpenAPI 스키마를 읽어 `paths`와 `components` 인터페이스를 생성한다:

```ts
// generated/types.ts (자동 생성)
export interface paths {
  '/health': {
    get: {
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['HealthResponse']
          }
        }
      }
    }
  }
}

export interface components {
  schemas: {
    HealthResponse: {
      status: 'ok' | 'error'
    }
    User: {
      id: string
      email: string
      name: string
    }
  }
}
```

**Result** — OpenAPI 명세에서 TS 타입이 자동 생성되므로, 수동 타입 작성이 불필요하고 드리프트가 구조적으로 불가능하다. `openapi-typescript`는 OpenAPI 3.0/3.1을 모두 지원하며 2026.02 기준 가장 널리 사용되는 OpenAPI-to-TS 도구.

---

## Nx `dependsOn` — codegen 자동 선행 실행

**Problem** — `codegen`을 빠뜨리고 `typecheck`이나 `build`를 실행하면 `types.ts`가 없어서 import 에러가 발생한다:

```
Cannot find module '@fullstack-forge/api-spec/types'
```

개발자가 매번 codegen을 수동으로 먼저 실행해야 한다면 실수가 반복된다.

**Action** — `nx.json`의 `targetDefaults`에서 `build`와 `typecheck`이 `codegen`에 의존하도록 선언한다:

```jsonc
// nx.json
{
  "targetDefaults": {
    "codegen": { "dependsOn": ["^codegen"], "cache": true },
    "build": { "dependsOn": ["codegen", "^build"], "cache": true },
    "typecheck": { "dependsOn": ["codegen", "^typecheck"], "cache": true },
  },
}
```

실행 의미:

```
pnpm typecheck
  └── Nx가 codegen을 먼저 실행
      └── tsp compile + openapi-typescript
          └── types.ts 생성 완료
              └── typecheck 실행
```

**Result** — `codegen` 누락이 구조적으로 불가능하다. Nx 캐시가 spec 파일 변경이 없으면 codegen을 건너뛰어 빌드 속도도 유지된다.

---

## Generated 파일 정책 — commit vs gitignore

**Problem** — 생성된 파일을 모두 commit하면 PR diff가 불필요하게 커지고, 모두 gitignore하면 CI에서 계약 변경 이력을 추적할 수 없다.

**Action** — 계약 파일과 파생 파일을 구분하여 정책을 분리한다:

| 파일                                       | 정책           | 이유                                                |
| ------------------------------------------ | -------------- | --------------------------------------------------- |
| `packages/api-spec/generated/openapi.yaml` | **git commit** | 언어 무관 계약(SSOT). 리뷰 가능한 변경 이력 유지    |
| `packages/api-spec/generated/types.ts`     | **gitignore**  | `openapi.yaml`에서 언제든 재생성 가능한 파생 산출물 |

원칙: **계약 파일은 commit, 언어별 파생 파일은 regenerate.**

```bash
# fresh clone 후 필수 순서
pnpm install
pnpm --filter @fullstack-forge/api-spec codegen   # types.ts 생성
pnpm typecheck                                     # 이제 정상 동작
```

**Result** — `openapi.yaml`의 diff로 API 계약 변경을 PR에서 리뷰할 수 있고, `types.ts`는 항상 최신 상태로 재생성된다. CI에서 stale 검출도 가능하다.

> **Caveat**: fresh clone이나 branch 전환 후 반드시 `codegen`을 실행해야 한다. 이를 빠뜨리면 `Cannot find module` 에러가 발생한다. `pnpm typecheck`을 실행하면 Nx가 자동으로 codegen을 선행 실행하므로, 대부분의 경우 문제가 되지 않는다.

---

## 이 프로젝트에서의 적용

| 결정                           | 해결하는 문제                                          |
| ------------------------------ | ------------------------------------------------------ |
| `tsp compile` (OpenAPI 생성)   | TypeSpec 소스와 OpenAPI 명세 간 불일치 방지            |
| `openapi-typescript` (TS 생성) | OpenAPI 명세와 TypeScript 타입 간 드리프트 구조적 차단 |
| Nx `dependsOn` 자동화          | codegen 누락으로 인한 빌드/타입체크 실패 방지          |
| commit/gitignore 정책 분리     | 계약 이력은 추적하면서 불필요한 diff 팽창 방지         |

---

> **근거 문서**: [ADR-0003: API 계약을 TypeSpec -> OpenAPI로 관리](../../adr/ADR-0003-contract-first-typespec-openapi.md)

---

## 다음 문서

[03. 타입 소비 패턴](./03-type-consumption-patterns.md) — 생성된 API 타입을 프론트엔드와 백엔드에서 어떻게 안전하게 소비하는가?
