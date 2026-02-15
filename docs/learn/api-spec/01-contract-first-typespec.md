# 01. Contract-First와 TypeSpec 선택

## 핵심 질문

> 왜 코드가 아니라 TypeSpec DSL에서 API 계약을 먼저 정의하는가?

## 한 줄 답

**계약이 코드보다 먼저 존재해야** 프론트/백이 동시에 개발할 수 있고, 계약 변경의 영향 범위를 코드 변경 전에 파악할 수 있다.

---

## 현재 접근 방식

```
packages/api-spec/
├── src/
│   └── main.tsp              # TypeSpec 엔트리 (SSOT)
├── generated/
│   ├── openapi.yaml           # git committed — 언어 무관 API 계약
│   └── types.ts               # gitignored — codegen 출력물
├── tspconfig.yaml
└── package.json
```

TypeSpec `.tsp` 파일이 API 계약의 단일 진실 원천(SSOT). 모든 타입과 OpenAPI 명세는 이 파일에서 파생된다.

---

## Contract-First vs Code-First — 계약 정의 순서

**Problem** — Code-First(코드 우선) 방식에서는 백엔드 라우터를 먼저 구현하고, 거기서 타입을 추출하거나 스키마를 생성한다. 이 방식의 문제는 세 가지다:

1. 프론트엔드가 백엔드 구현을 기다려야 한다 (병렬 개발 불가)
2. 백엔드 구현 변경이 곧 계약 변경이 되어, 의도치 않은 API 파괴가 발생한다
3. 계약 변경의 영향 범위를 사전에 파악할 수 없다

```
Code-First 흐름:
  백엔드 코드 작성 → 타입 추출 → 프론트엔드 소비
  ❌ 백엔드 리팩토링 = 계약 변경 (의도 여부 불명)
  ❌ 프론트엔드는 백엔드 완성까지 대기
```

**Action** — Contract-First(계약 우선)는 순서를 뒤집는다. API 명세를 먼저 정의하고, 프론트/백 모두 이 명세를 기준으로 개발한다:

```
Contract-First 흐름:
  TypeSpec 명세 작성 → codegen → 프론트/백 동시 개발
  ✅ 명세 변경 = PR 리뷰 대상 (openapi.yaml diff)
  ✅ 프론트/백 독립 개발 가능
```

**Result** — 프론트/백 병렬 개발이 가능해지고, 계약 변경이 명시적 PR 리뷰 대상이 된다. API-first 설계는 Stripe, GitHub, Shopify 등 대규모 API 제공자의 표준 관행. 2026.02 기준 권장.

---

## TypeSpec vs OpenAPI 수동 작성 — DSL 선택

**Problem** — OpenAPI 3.1 YAML을 직접 작성하면 반복이 많고, 제네릭이나 유니온 타입을 표현하기 어렵다. 퀵커머스 도메인에서 주문/리뷰/문의 API가 추가될수록 명세 파일이 수백~수천 줄로 팽창하여 유지보수가 비현실적이 된다:

```yaml
# OpenAPI 수동 작성 — 단순한 Health API도 장황함
paths:
  /health:
    get:
      operationId: Health_check
      responses:
        '200':
          description: Successful
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

**Action** — TypeSpec DSL로 동일한 명세를 간결하게 작성하고, OpenAPI는 컴파일 출력으로 생성한다:

```typespec
// TypeSpec — 같은 API를 간결하게 표현
import "@typespec/http";
using TypeSpec.Http;

model HealthResponse {
  status: "ok" | "error";
}

@route("/health")
namespace Health {
  @get op check(): HealthResponse;
}
```

**Result** — TypeSpec은 제네릭, 유니온, 데코레이터를 지원하여 복잡한 도메인 모델도 간결하게 표현한다. Microsoft가 주도하는 프로젝트로, Azure SDK 전체가 TypeSpec 기반으로 전환 중. 2026.02 기준 신규 API 프로젝트에 적합한 선택.

> **Caveat**: TypeSpec DSL의 학습 비용이 존재한다. 그러나 TypeScript 문법과 유사하여 TS 개발자라면 진입 장벽이 낮고, 한번 작성하면 OpenAPI + TypeScript 타입이 동시에 생성되므로 투자 대비 효율이 높다.

---

## SSOT(단일 진실 원천) — 계약 분산 방지

**Problem** — API 계약이 여러 곳에 분산되면 드리프트(drift)가 발생한다. 예를 들어 백엔드 Hono 라우터의 `typeof app` 타입, Swagger 문서, 프론트엔드 타입 정의가 각각 따로 존재하면:

```
계약 분산 시 드리프트:
  백엔드: { status: "ok" | "error" }
  Swagger: { status: string }           ← 누군가 enum 빠뜨림
  프론트: { status: "ok" }              ← 옛날 버전 복사
  → 런타임 에러로만 발견됨
```

**Action** — TypeSpec `.tsp` 파일을 유일한 계약 원천으로 정의하고, 나머지는 모두 파생물로 관리한다:

```
SSOT 구조:
  main.tsp (원천)
    → openapi.yaml (파생 — git commit, 리뷰 대상)
    → types.ts (파생 — gitignore, 재생성 가능)
    → 프론트/백 타입 import (소비)
```

이 프로젝트의 `package.json`에서 `exports`로 소비 경로를 명시한다:

```jsonc
// packages/api-spec/package.json
{
  "exports": {
    "./types": {
      "types": "./generated/types.ts",
      "default": "./generated/types.ts",
    },
    "./openapi": "./generated/openapi.yaml",
  },
}
```

**Result** — 계약이 하나의 원천에서만 변경되므로 드리프트가 구조적으로 불가능하다. OpenAPI 출력은 git commit하여 리뷰 가능한 변경 이력을 유지하고, TypeScript 타입은 gitignore하여 재생성으로 항상 최신 상태를 보장한다.

---

## 이 프로젝트에서의 적용

| 결정                | 해결하는 문제                                        |
| ------------------- | ---------------------------------------------------- |
| Contract-First 접근 | 프론트/백 병렬 개발 가능, 의도치 않은 계약 파괴 방지 |
| TypeSpec DSL 채택   | OpenAPI 수동 작성의 장황함과 유지보수 비용 제거      |
| SSOT 원칙           | 계약 분산으로 인한 드리프트 구조적 차단              |

---

> **근거 문서**: [ADR-0003: API 계약을 TypeSpec -> OpenAPI로 관리](../../adr/ADR-0003-contract-first-typespec-openapi.md)

---

## 다음 문서

[02. Codegen 파이프라인](./02-codegen-pipeline.md) — TypeSpec에서 작성한 명세가 어떻게 프론트/백 타입으로 변환되는가?
