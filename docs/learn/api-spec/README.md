# API 명세(TypeSpec) 심층 분석

이 프로젝트의 `packages/api-spec/` 패키지 구성을 단계별로 분해하여,
**왜 Contract-First인지**, **codegen 파이프라인이 어떻게 동작하는지**, **생성된 타입을 어떻게 소비하는지** 를 설명한다.

> 기준 환경: TypeSpec · OpenAPI 3.1 · openapi-typescript · pnpm workspaces · Nx

## 문서 순서

| #   | 문서                                                              | 핵심 질문                                                             |
| --- | ----------------------------------------------------------------- | --------------------------------------------------------------------- |
| 01  | [Contract-First와 TypeSpec 선택](./01-contract-first-typespec.md) | 왜 코드가 아니라 TypeSpec DSL에서 API 계약을 먼저 정의하는가?         |
| 02  | [Codegen 파이프라인](./02-codegen-pipeline.md)                    | TypeSpec에서 작성한 명세가 어떻게 프론트/백 타입으로 변환되는가?      |
| 03  | [타입 소비 패턴](./03-type-consumption-patterns.md)               | 생성된 API 타입을 프론트엔드와 백엔드에서 어떻게 안전하게 소비하는가? |

## 전제 지식

- TypeScript 기본 문법 (제네릭, 인덱스 접근 타입 수준)
- REST API와 OpenAPI 스키마의 개념
- `package.json`의 `exports` 필드 이해

## 이 프로젝트의 설정 파일

```
packages/api-spec/
├── src/
│   └── main.tsp              ← TypeSpec 엔트리 (SSOT)
├── generated/
│   ├── openapi.yaml           ← git committed (언어 무관 계약)
│   └── types.ts               ← gitignored (codegen 출력물)
├── tspconfig.yaml             ← TypeSpec 컴파일러 설정
└── package.json               ← exports, codegen 스크립트
```

## 연관 문서

- 패키지 레시피: [harness/02-packages](../../harness/02-packages.md)
- 연동 표준: [harness/05-integration](../../harness/05-integration.md)
- 구현 표준 전체: [harness/00-overview](../../harness/00-overview.md)
- 실행 체크리스트: [execution/00-workspace-baseline](../../execution/00-workspace-baseline.md)
