# DB 설계 의사결정 근거

이 문서는 "테이블을 어떻게 만들었는가"보다 "왜 그렇게 만들었는가"에 집중한다.
PRD 요구사항을 어떤 스키마 결정(enum, FK, 제약, 관계, 분리 구조)로 달성했는지 추적 가능한 형태로 정리한다.

> 기준 범위: `apps/api/src/db/schema/*`, `apps/api/drizzle/0000_rich_the_order.sql`, PRD/ADR/Harness/Execution/Plan 문서

## 문서 순서

| #   | 문서                                                                               | 핵심 질문                                                                     |
| --- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 01  | [요구사항-스키마 추적 지도](./01-requirement-to-schema-traceability.md)            | 어떤 요구사항이 어떤 테이블/제약으로 연결되는가?                              |
| 02  | [인증·계정 테이블 설계 근거](./02-auth-and-account-table-rationale.md)             | auth/account 영역 테이블은 어떤 보안·권한 요구를 만족하기 위해 이런 구조인가? |
| 03  | [주문·재고·결제·배송 테이블 설계 근거](./03-commerce-core-table-rationale.md)      | 커머스 코어 테이블은 어떤 운영/정합성 요구를 만족하기 위해 이런 구조인가?     |
| 04  | [무결성·운영성·마이그레이션 설계 근거](./04-integrity-and-operations-rationale.md) | 왜 enum/FK/check/마이그레이션 분리 전략을 함께 쓰는가?                        |
| 05  | [도메인 분할 ERD](./05-domain-erd-split-view.md)                                   | 현재 스키마를 도메인 단위로 보면 관계 구조가 어떻게 나뉘는가?                 |

## 전제 지식

- 관계형 DB 기본 개념(테이블, PK/FK, 인덱스)
- Drizzle 스키마와 마이그레이션 기본 흐름
- PRD/ADR 문서를 코드 설계와 연결해서 읽는 습관

## 이 프로젝트의 설정 파일

```text
apps/api/src/db/
├── schema.ts                   ← 외부 노출용 명시적 export 진입점
└── schema/
    ├── auth.ts                 ← 계정/인증/감사 로그
    ├── product.ts              ← 상품/재고
    ├── order.ts                ← 주문/결제/배송/대체
    ├── review.ts               ← 리뷰/댓글
    ├── inquiry.ts              ← 고객 문의/답변
    └── relations.ts            ← relations API 집합

apps/api/drizzle/
└── 0000_rich_the_order.sql     ← 실제 DDL(FK/CHECK/UNIQUE 포함)
```

## 연관 문서

- 구현 레시피: [harness/04-backend](../../harness/04-backend.md)
- 실행 검증: [execution/01-db-and-migrations](../../execution/01-db-and-migrations.md)
- 요구사항 원문: [prd/02-user-flows-and-auth-policy](../../prd/02-user-flows-and-auth-policy.md), [prd/03-commerce-domain-policy](../../prd/03-commerce-domain-policy.md)
- 아키텍처 결정: [adr/ADR-0002-backend-stack-hono-drizzle-postgres-redis](../../adr/ADR-0002-backend-stack-hono-drizzle-postgres-redis.md)
