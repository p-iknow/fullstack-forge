# Backend Architecture

백엔드 계층은 API 서버, 데이터베이스, 이벤트 처리 등 서버 측 아키텍처를 다룬다.
Hono, Drizzle ORM, PostgreSQL, Redis를 기반으로 한 설계와 의사결정을 포함한다.

## 문서 목록

| 파일                                                     | 유형     | 설명                                               |
| -------------------------------------------------------- | -------- | -------------------------------------------------- |
| [01-backend.md](./01-backend.md)                         | 설계     | 백엔드 스택 개요: Hono, Drizzle, PostgreSQL, Redis |
| [01-backend.adr.md](./01-backend.adr.md)                 | 의사결정 | 백엔드 스택 선택 근거 및 트레이드오프              |
| [02-eventing.adr.md](./02-eventing.adr.md)               | 의사결정 | 이벤트 신뢰성 설계 (SNS-SQS, DLQ, 멱등성)         |

> 도메인별 정책(인증, 주문, 결제, 재고 등)은 ADR로 별도 관리하지 않는다.
> PRD가 도메인 정책의 단일 기준(source of truth)이며, `docs/01-prd/` 하위 각 도메인 폴더를 참조한다.

## 빠른 네비게이션

### 설계 이해

- **백엔드 개요**: [01-backend.md](./01-backend.md)

### 의사결정 근거

- **백엔드 스택**: [01-backend.adr.md](./01-backend.adr.md)
- **이벤트 신뢰성**: [02-eventing.adr.md](./02-eventing.adr.md)

### 도메인 정책 (PRD 참조)

- **인증/보안**: [docs/01-prd/01-auth/01-overview.md](../../01-prd/01-auth/01-overview.md)
- **주문 라이프사이클**: [docs/01-prd/05-order/01-overview.md](../../01-prd/05-order/01-overview.md)
- **결제 신뢰성**: [docs/01-prd/06-payment/01-overview.md](../../01-prd/06-payment/01-overview.md)
- **재고 동시성**: [docs/01-prd/03-inventory/01-overview.md](../../01-prd/03-inventory/01-overview.md)
- **카탈로그 정책**: [docs/01-prd/02-catalog/01-overview.md](../../01-prd/02-catalog/01-overview.md)
- **장바구니 정책**: [docs/01-prd/04-cart/01-overview.md](../../01-prd/04-cart/01-overview.md)
- **배송 SLA**: [docs/01-prd/07-delivery/01-overview.md](../../01-prd/07-delivery/01-overview.md)
- **프로모션 엔진**: [docs/01-prd/08-promotion/01-overview.md](../../01-prd/08-promotion/01-overview.md)
- **포인트 원장**: [docs/01-prd/09-loyalty/01-overview.md](../../01-prd/09-loyalty/01-overview.md)
- **리뷰 모더레이션**: [docs/01-prd/10-review/01-overview.md](../../01-prd/10-review/01-overview.md)
- **문의 SLA**: [docs/01-prd/11-inquiry/01-overview.md](../../01-prd/11-inquiry/01-overview.md)
- **알림 소비자**: [docs/01-prd/12-notification/01-overview.md](../../01-prd/12-notification/01-overview.md)

## 관련 문서

- **기초 아키텍처**: [../base/README.md](../base/README.md)
- **프론트엔드 계층**: [../frontend/README.md](../frontend/README.md)
- **통합 계층**: [../integration/README.md](../integration/README.md)
- **아키텍처 메인**: [../README.md](../README.md)
