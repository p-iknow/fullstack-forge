# 02. OpenAPI/타입 생성 파이프라인

## 핵심 질문

> route schema 변경이 OpenAPI와 타입 소비 코드까지 어떻게 연결되는가?

## 한 줄 답

**route schema 변경 -> OpenAPI export -> 타입 생성 -> typecheck** 순서를 항상 고정하면 계약 드리프트를 구조적으로 차단할 수 있다.

---

## 현재 흐름

```text
apps/api/src/routes/**/route.ts (+ 필요한 경우 sibling `schema.ts`)
    │
    ├── OpenAPI export ──→ packages/api-spec/generated/openapi.yaml
    │                       │
    │                       └── openapi-typescript ──→ packages/api-spec/generated/types.ts
    │
    ├── 프론트: paths 타입 소비
    └── 백엔드: components 타입 소비
```

---

## 운영 루프

```bash
# 1) route schema 수정
# 2) codegen 실행
pnpm --filter @fullstack-forge/api-spec codegen

# 3) 타입 검증
pnpm typecheck
```

`codegen`을 먼저 실행하지 않으면 생성 타입이 낡아서 오탐/누락이 발생할 수 있다.

---

## CI 기준

CI는 최소 아래 순서를 따라야 한다.

1. `pnpm exec nx run-many -t codegen`
2. `pnpm check` (`lint/format/sheriff/knip`)
3. `pnpm build`
4. `pnpm test`

핵심은 "생성물 최신화 이후 품질 게이트"다.

---

## 파일 정책

| 파일                                       | 정책                                   |
| ------------------------------------------ | -------------------------------------- |
| `packages/api-spec/generated/openapi.yaml` | 계약 산출물로 커밋하여 변경 이력 추적  |
| `packages/api-spec/generated/types.ts`     | codegen 출력물로 관리 (필요 시 재생성) |

---

## 이 프로젝트에서의 적용

| 결정                | 해결하는 문제                                  |
| ------------------- | ---------------------------------------------- |
| codegen-first 검증  | stale 타입/문서 상태에서의 검증 실패/오판 방지 |
| OpenAPI 산출물 추적 | 계약 변경 리뷰 가능성 확보                     |

---

> 근거 문서: [architecture/integration/01-integration](../../02-architecture/integration/01-integration.md), [architecture/base/04-tooling](../../02-architecture/base/04-tooling.md)
