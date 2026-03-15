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
| 이벤트 신뢰성 설계        | 의사결정  | [backend/02-eventing.adr.md](./backend/02-eventing.adr.md)               |
| 관측성 설계               | 의사결정  | [base/08-observability.adr.md](./base/08-observability.adr.md)           |
| 통합 설계                 | 의사결정  | [integration/01-integration.adr.md](./integration/01-integration.adr.md) |

## PRD 추적 인덱스

- **도메인 정책 참조**: [backend/README.md](./backend/README.md) — 도메인별 정책은 PRD를 단일 기준으로 사용한다.

## Stage 게이트 점검

| Stage                          | 점검 포인트                         | 기준 문서                                                                                                                                                                                                                     |
| ------------------------------ | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stage 1 (Auth)                 | 세션/토큰/보안 정책 명시            | [prd/01-auth](../01-prd/01-auth/01-overview.md)                                                                                                                                                                               |
| Stage 2 (Catalog/Cart)         | 판매 가능 판정 + cart TTL/전환 정책 | [prd/02-catalog](../01-prd/02-catalog/01-overview.md), [prd/04-cart](../01-prd/04-cart/01-overview.md)                                                                                                                         |
| Stage 3 (Order Core)           | 주문/결제/재고/프로모션 연계 결정   | [prd/05-order](../01-prd/05-order/01-overview.md), [prd/06-payment](../01-prd/06-payment/01-overview.md), [prd/03-inventory](../01-prd/03-inventory/01-overview.md), [prd/08-promotion](../01-prd/08-promotion/01-overview.md) |
| Stage 4~5 (Fanout/Reliability) | 이벤트 계약 + 멱등 + DLQ/redrive   | [backend/02-eventing.adr.md](./backend/02-eventing.adr.md), [prd/13-event](../01-prd/13-event/01-overview.md), [prd/12-notification](../01-prd/12-notification/01-overview.md)                                                 |
| Stage 6 (Admin Ops)            | 배송 SLA/문의 SLA/모더레이션 운영   | [prd/07-delivery](../01-prd/07-delivery/01-overview.md), [prd/10-review](../01-prd/10-review/01-overview.md), [prd/11-inquiry](../01-prd/11-inquiry/01-overview.md)                                                             |
| Stage 7 (Observability)        | KPI 기반 알림/롤백 운영             | [base/08-observability.adr.md](./base/08-observability.adr.md), [prd/14-observability](../01-prd/14-observability/01-overview.md)                                                                                              |

## ADR 로그

| ADR      | 제목                                                                            | 상태     | 링크                                                                     |
| -------- | ------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------ |
| ADR-0000 | ADR 규칙과 추적성                                                               | Accepted | [base/01-overview.adr.md](./base/01-overview.adr.md)                     |
| ADR-0001 | Frontend Stack으로 TanStack Start 선택                                          | Accepted | [frontend/01-frontend.adr.md](./frontend/01-frontend.adr.md)             |
| ADR-0002 | Backend Stack으로 Hono + Drizzle + PostgreSQL + Redis 선택                      | Accepted | [backend/01-backend.adr.md](./backend/01-backend.adr.md)                 |
| ADR-0003 | API 계약 기준을 @fullstack-forge/api-spec로 관리 (생성 원천: @hono/zod-openapi) | Accepted | [integration/01-integration.adr.md](./integration/01-integration.adr.md) |
| ADR-0004 | SNS -> SQS fanout + DLQ + Idempotency 선택                                     | Accepted | [backend/02-eventing.adr.md](./backend/02-eventing.adr.md)               |
| ADR-0005 | Prometheus + Grafana 선택                                                       | Accepted | [base/08-observability.adr.md](./base/08-observability.adr.md)           |
| ADR-0006 | 비동기 상태 분기를 Suspensive 선언적 경계로 전환                                | Accepted | [frontend/03-suspensive-boundaries.adr.md](./frontend/03-suspensive-boundaries.adr.md) |

## 관련 문서

- **제품 요구사항(PRD)**: [docs/01-prd/README.md](../01-prd/README.md)
- **의사결정 기록(ADR)**: 각 계층별 `.adr.md` 파일 참조
- **심층 학습(Learn)**: [docs/03-learn/README.md](../03-learn/README.md) — 왜 이 설정인가를 설명하는 교과서

## 읽는 순서

1. **전체 그림 파악**: [base/01-overview.md](./base/01-overview.md)
2. **스택 선택 근거**: [backend/01-backend.adr.md](./backend/01-backend.adr.md), [frontend/01-frontend.adr.md](./frontend/01-frontend.adr.md)
3. **계층별 설계**: base → backend → frontend → integration 순서로 각 디렉토리 README 참조
