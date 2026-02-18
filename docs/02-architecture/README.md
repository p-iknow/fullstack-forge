# Architecture Documentation

이 디렉토리는 `fullstack-forge` 애플리케이션의 아키텍처 설계를 계층별로 정리한 문서 모음이다.
각 문서는 의사결정 기록(ADR)과 설계 명세(Design)로 분류되어 있다.

## 문서 분류 규칙

| 확장자    | 의미                                         | 예시                |
| --------- | -------------------------------------------- | ------------------- |
| `.md`     | 설계 명세 (Design Specification)             | `01-backend.md`     |
| `.adr.md` | 의사결정 기록 (Architecture Decision Record) | `01-backend.adr.md` |

## 디렉토리 구조

### [base/](./base/README.md) — 기초 아키텍처

전체 시스템의 기초가 되는 설계: 개요, 기초 설정, 패키지 구조, 도구 선택, 관측성 의사결정.

### [backend/](./backend/README.md) — 백엔드 계층

백엔드 스택 설계 및 의사결정: 백엔드 설계, 이벤트 신뢰성.

### [frontend/](./frontend/README.md) — 프론트엔드 계층

프론트엔드 스택 설계 및 의사결정.

### [integration/](./integration/README.md) — 통합 계층

시스템 간 통합 설계 및 의사결정.

## 빠른 네비게이션

| 목적                      | 문서      | 링크                                                                     |
| ------------------------- | --------- | ------------------------------------------------------------------------ |
| 전체 아키텍처 개요        | 기초 설계 | [base/01-overview.md](./base/01-overview.md)                             |
| 백엔드 스택 선택 근거     | 의사결정  | [backend/01-backend.adr.md](./backend/01-backend.adr.md)                 |
| 프론트엔드 스택 선택 근거 | 의사결정  | [frontend/01-frontend.adr.md](./frontend/01-frontend.adr.md)             |
| 이벤트 신뢰성 설계        | 의사결정  | [backend/04-eventing.adr.md](./backend/04-eventing.adr.md)               |
| 관측성 설계               | 의사결정  | [base/08-observability.adr.md](./base/08-observability.adr.md)           |
| 통합 설계                 | 의사결정  | [integration/01-integration.adr.md](./integration/01-integration.adr.md) |

## PRD 추적 인덱스

- **백엔드 도메인 ADR 인덱스**: [backend/README.md](./backend/README.md)
- **추적 기준**: 각 ADR의 `PRD Traceability` 섹션을 기준으로 `Satisfies/Supports`를 관리한다.

## Stage 게이트 점검

| Stage                          | 점검 포인트                         | 선행 ADR                                                                                                                                                                                                                                                                                                                     |
| ------------------------------ | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stage 1 (Auth)                 | 세션/토큰/보안 정책 명시            | [backend/02-auth-security.adr.md](./backend/02-auth-security.adr.md)                                                                                                                                                                                                                                                         |
| Stage 2 (Catalog/Cart)         | 판매 가능 판정 + cart TTL/전환 정책 | [backend/07-catalog-policy.adr.md](./backend/07-catalog-policy.adr.md), [backend/08-cart-lifecycle.adr.md](./backend/08-cart-lifecycle.adr.md)                                                                                                                                                                               |
| Stage 3 (Order Core)           | 주문/결제/재고/프로모션 연계 결정   | [backend/03-order-lifecycle.adr.md](./backend/03-order-lifecycle.adr.md), [backend/05-payment-reliability.adr.md](./backend/05-payment-reliability.adr.md), [backend/06-inventory-concurrency.adr.md](./backend/06-inventory-concurrency.adr.md), [backend/10-promotion-engine.adr.md](./backend/10-promotion-engine.adr.md) |
| Stage 4~5 (Fanout/Reliability) | 이벤트 계약 + 멱등 + DLQ/redrive    | [backend/04-eventing.adr.md](./backend/04-eventing.adr.md), [backend/14-notification-consumer.adr.md](./backend/14-notification-consumer.adr.md), [backend/11-loyalty-ledger.adr.md](./backend/11-loyalty-ledger.adr.md)                                                                                                     |
| Stage 6 (Admin Ops)            | 배송 SLA/문의 SLA/모더레이션 운영   | [backend/09-delivery-sla.adr.md](./backend/09-delivery-sla.adr.md), [backend/12-review-moderation.adr.md](./backend/12-review-moderation.adr.md), [backend/13-inquiry-sla.adr.md](./backend/13-inquiry-sla.adr.md)                                                                                                           |
| Stage 7 (Observability)        | KPI 기반 알림/롤백 운영             | [base/08-observability.adr.md](./base/08-observability.adr.md)                                                                                                                                                                                                                                                               |

## ADR 로그

| ADR      | 제목                                                                            | 상태     | 링크                                                                                 |
| -------- | ------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------ |
| ADR-0000 | ADR 규칙과 추적성                                                               | Accepted | [base/01-overview.adr.md](./base/01-overview.adr.md)                                 |
| ADR-0001 | Frontend Stack으로 TanStack Start 선택                                          | Accepted | [frontend/01-frontend.adr.md](./frontend/01-frontend.adr.md)                         |
| ADR-0002 | Backend Stack으로 Hono + Drizzle + PostgreSQL + Redis 선택                      | Accepted | [backend/01-backend.adr.md](./backend/01-backend.adr.md)                             |
| ADR-0003 | API 계약 기준을 @fullstack-forge/api-spec로 관리 (생성 원천: @hono/zod-openapi) | Accepted | [integration/01-integration.adr.md](./integration/01-integration.adr.md)             |
| ADR-0004 | SNS -> SQS fanout + DLQ + Idempotency 선택                                      | Accepted | [backend/04-eventing.adr.md](./backend/04-eventing.adr.md)                           |
| ADR-0005 | Prometheus + Grafana 선택                                                       | Accepted | [base/08-observability.adr.md](./base/08-observability.adr.md)                       |
| ADR-0006 | 인증 보안 구조로 JWT Access + Opaque Refresh Rotation 선택                      | Accepted | [backend/02-auth-security.adr.md](./backend/02-auth-security.adr.md)                 |
| ADR-0007 | 주문 라이프사이클을 상태 머신 + 보상 트랜잭션으로 관리                          | Accepted | [backend/03-order-lifecycle.adr.md](./backend/03-order-lifecycle.adr.md)             |
| ADR-0008 | 결제 안정성으로 30초 타임아웃 + 주문 단위 멱등 처리 선택                        | Accepted | [backend/05-payment-reliability.adr.md](./backend/05-payment-reliability.adr.md)     |
| ADR-0009 | 재고 정합성으로 Optimistic Lock 기본 + 고경합 SKU Row Lock 선택                 | Accepted | [backend/06-inventory-concurrency.adr.md](./backend/06-inventory-concurrency.adr.md) |
| ADR-0010 | 카탈로그 판매 가능 판정을 상태 + 가용재고 결합 규칙으로 고정                    | Accepted | [backend/07-catalog-policy.adr.md](./backend/07-catalog-policy.adr.md)               |
| ADR-0011 | 장바구니 라이프사이클을 TTL 만료 + 단방향 전환으로 관리                         | Accepted | [backend/08-cart-lifecycle.adr.md](./backend/08-cart-lifecycle.adr.md)               |
| ADR-0012 | 배송 운영은 SLA 계산 필드 + 재배차 경보 경로로 표준화                           | Accepted | [backend/09-delivery-sla.adr.md](./backend/09-delivery-sla.adr.md)                   |
| ADR-0013 | 프로모션 계산은 단일 선택 엔진 + 스냅샷 저장으로 고정                           | Accepted | [backend/10-promotion-engine.adr.md](./backend/10-promotion-engine.adr.md)           |
| ADR-0014 | 포인트는 Ledger SSOT + 계정 잔액 대사 모델로 관리                               | Accepted | [backend/11-loyalty-ledger.adr.md](./backend/11-loyalty-ledger.adr.md)               |
| ADR-0015 | 리뷰 모더레이션은 상태 전이 + 권한 분리 정책으로 운영                           | Accepted | [backend/12-review-moderation.adr.md](./backend/12-review-moderation.adr.md)         |
| ADR-0016 | 문의 운영은 상태 머신 + 24시간 응답 SLA 타이머로 관리                           | Accepted | [backend/13-inquiry-sla.adr.md](./backend/13-inquiry-sla.adr.md)                     |
| ADR-0017 | 알림은 fanout 소비자 분리 + 이벤트 멱등 소비로 처리                             | Accepted | [backend/14-notification-consumer.adr.md](./backend/14-notification-consumer.adr.md) |

## 관련 문서

- **제품 요구사항(PRD)**: [docs/01-prd/README.md](../01-prd/README.md)
- **의사결정 기록(ADR)**: 각 계층별 `.adr.md` 파일 참조
- **심층 학습(Learn)**: [docs/03-learn/README.md](../03-learn/README.md) — 왜 이 설정인가를 설명하는 교과서

## 읽는 순서

1. **전체 그림 파악**: [base/01-overview.md](./base/01-overview.md)
2. **스택 선택 근거**: [backend/01-backend.adr.md](./backend/01-backend.adr.md), [frontend/01-frontend.adr.md](./frontend/01-frontend.adr.md)
3. **계층별 설계**: base → backend → frontend → integration 순서로 각 디렉토리 README 참조
