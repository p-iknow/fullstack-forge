# Cart Events

## 범위

장바구니 도메인의 최소 이벤트 타입을 정의한다.
이벤트 엔벨로프 공통 규격은 `../13-event/01-overview.md`를 따른다.

## 이벤트 타입

- `CartExpired`
- `CartConverted`

## 토픽/큐 라우팅

- 토픽: `cart-events` (SNS)
- 소비 큐: `notifications` (SQS) — 13-event fanout 구조의 notifications 큐에서 소비

## 이벤트별 역할

### CartExpired

- 발행 시점: TTL 배치 만료 처리 후, `Cart.status`가 `expired`로 변경된 직후
- 역할: 사용자에게 장바구니 만료 알림 전달
- 소비자: `notification`
- 멱등성 키: `idempotency:notification:{eventId}`
- payload 필드 개요
  - `cart_id`: 장바구니 식별자
  - `user_id`: 장바구니 소유자 식별자
  - `expired_at`: 만료 처리 시각
- 비고: 장바구니는 재고를 예약하지 않으므로, 만료 시 재고 관련 후속 처리는 없다.

### CartConverted

- 발행 시점: 주문 생성 트랜잭션 커밋 후 (`Cart.status` → `converted` 확정 이후)
- 역할: 주문 전환 완료 후속 처리 (사용자 알림, 분석 데이터 수집)
- 소비자: `notification`
- 멱등성 키: `idempotency:notification:{eventId}`
- payload 필드 개요
  - `cart_id`: 장바구니 식별자
  - `order_id`: 전환된 주문 식별자
  - `user_id`: 장바구니 소유자 식별자
  - `converted_at`: 전환 처리 시각
- 비고: 주문 생성 자체의 후속 처리(재고 예약, 결제 등)는 `OrderCreated` 이벤트가 담당한다. CartConverted는 장바구니 관점의 알림과 분석 용도로만 사용한다.

## 운영 규칙

- 이벤트 상세 스키마는 공통 엔벨로프 규격과 버전 정책을 따른다
- 멱등성 키, 재시도, DLQ/redrive 규칙은 [이벤트 인프라 운영 정책](../13-event/01-overview.md)을 따른다
- 이벤트 순서 보장: 동일 `cart_id`에 대한 이벤트 순서는 보장하지 않는다. 소비자는 `occurredAt` 기준으로 최신 상태를 판별한다.
