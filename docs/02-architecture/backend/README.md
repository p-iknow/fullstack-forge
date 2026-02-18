# Backend Architecture

백엔드 계층은 API 서버, 데이터베이스, 이벤트 처리 등 서버 측 아키텍처를 다룬다.
Hono, Drizzle ORM, PostgreSQL, Redis를 기반으로 한 설계와 의사결정을 포함한다.

## 문서 목록

| 파일                                                                 | 유형     | 설명                                               |
| -------------------------------------------------------------------- | -------- | -------------------------------------------------- |
| [01-backend.md](./01-backend.md)                                     | 설계     | 백엔드 스택 개요: Hono, Drizzle, PostgreSQL, Redis |
| [01-backend.adr.md](./01-backend.adr.md)                             | 의사결정 | 백엔드 스택 선택 근거 및 트레이드오프              |
| [02-auth-security.adr.md](./02-auth-security.adr.md)                 | 의사결정 | 인증/세션/OAuth 보안 구조                          |
| [03-order-lifecycle.adr.md](./03-order-lifecycle.adr.md)             | 의사결정 | 주문 상태 머신/보상 트랜잭션 정책                  |
| [04-eventing.adr.md](./04-eventing.adr.md)                           | 의사결정 | 이벤트 신뢰성 설계 (SNS-SQS, DLQ, 멱등성)          |
| [05-payment-reliability.adr.md](./05-payment-reliability.adr.md)     | 의사결정 | 결제 타임아웃/멱등성/환불 연계                     |
| [06-inventory-concurrency.adr.md](./06-inventory-concurrency.adr.md) | 의사결정 | 재고 동시성 제어(Optimistic/Row Lock)              |
| [07-catalog-policy.adr.md](./07-catalog-policy.adr.md)               | 의사결정 | 카탈로그 판매 가능 판정 정책                       |
| [08-cart-lifecycle.adr.md](./08-cart-lifecycle.adr.md)               | 의사결정 | 장바구니 TTL/전환 라이프사이클                     |
| [09-delivery-sla.adr.md](./09-delivery-sla.adr.md)                   | 의사결정 | 배송 SLA 계산/재배차 운영 정책                     |
| [10-promotion-engine.adr.md](./10-promotion-engine.adr.md)           | 의사결정 | 할인 엔진/충돌 해소/스냅샷 정책                    |
| [11-loyalty-ledger.adr.md](./11-loyalty-ledger.adr.md)               | 의사결정 | 포인트 원장/대사 정합성 정책                       |
| [12-review-moderation.adr.md](./12-review-moderation.adr.md)         | 의사결정 | 리뷰 모더레이션 상태 전이/권한 정책                |
| [13-inquiry-sla.adr.md](./13-inquiry-sla.adr.md)                     | 의사결정 | 문의 상태 전이/24시간 SLA 정책                     |
| [14-notification-consumer.adr.md](./14-notification-consumer.adr.md) | 의사결정 | 알림 소비자 분리/멱등 소비 정책                    |

## 빠른 네비게이션

### 설계 이해

- **백엔드 개요**: [01-backend.md](./01-backend.md)

### 의사결정 근거

- **백엔드 스택**: [01-backend.adr.md](./01-backend.adr.md)
- **인증/보안**: [02-auth-security.adr.md](./02-auth-security.adr.md)
- **주문 라이프사이클**: [03-order-lifecycle.adr.md](./03-order-lifecycle.adr.md)
- **이벤트 신뢰성**: [04-eventing.adr.md](./04-eventing.adr.md)
- **결제 신뢰성**: [05-payment-reliability.adr.md](./05-payment-reliability.adr.md)
- **재고 동시성**: [06-inventory-concurrency.adr.md](./06-inventory-concurrency.adr.md)
- **카탈로그 정책**: [07-catalog-policy.adr.md](./07-catalog-policy.adr.md)
- **장바구니 정책**: [08-cart-lifecycle.adr.md](./08-cart-lifecycle.adr.md)
- **배송 SLA**: [09-delivery-sla.adr.md](./09-delivery-sla.adr.md)
- **프로모션 엔진**: [10-promotion-engine.adr.md](./10-promotion-engine.adr.md)
- **포인트 원장**: [11-loyalty-ledger.adr.md](./11-loyalty-ledger.adr.md)
- **리뷰 모더레이션**: [12-review-moderation.adr.md](./12-review-moderation.adr.md)
- **문의 SLA**: [13-inquiry-sla.adr.md](./13-inquiry-sla.adr.md)
- **알림 소비자**: [14-notification-consumer.adr.md](./14-notification-consumer.adr.md)

## 관련 문서

- **기초 아키텍처**: [../base/README.md](../base/README.md)
- **프론트엔드 계층**: [../frontend/README.md](../frontend/README.md)
- **통합 계층**: [../integration/README.md](../integration/README.md)
- **아키텍처 메인**: [../README.md](../README.md)
