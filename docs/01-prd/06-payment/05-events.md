# Payment Events

## 범위

결제 도메인에서 발행하는 이벤트의 최소 계약을 정의한다.
이벤트 엔벨로프 공통 규격은 `../13-event/01-overview.md`를 따른다.

## 토픽/큐 라우팅

- 발행 토픽: `payment-events` (SNS)
- 소비 큐: `../13-event/01-overview.md`의 fanout 구조에 따라 `notifications`, `inventory`, `dispatch` 큐로 분배
- 결제 이벤트는 주로 `notifications` 큐와 order 상태 연동에 소비된다.

## 이벤트 목록

### PaymentInitiated

- 발행 시점: 결제 요청 시작 시 (상태: `initiated`)
- idempotency key: `payment:{payment_id}`
- payload:

| 필드             | 타입              | 설명               |
| ---------------- | ----------------- | ------------------ |
| `payment_id`     | string (UUID)     | 결제 식별자        |
| `order_id`       | string (UUID)     | 연결된 주문 식별자 |
| `user_id`        | string (UUID)     | 결제 요청 사용자   |
| `amount`         | integer           | 결제 금액 (KRW)    |
| `payment_method` | string (enum)     | 결제 수단          |
| `initiated_at`   | string (ISO 8601) | 결제 시작 시각     |

### PaymentCaptured

- 발행 시점: 결제 매출 확정(captured) 완료 시
- idempotency key: `payment:{payment_id}:captured`
- payload:

| 필드          | 타입              | 설명               |
| ------------- | ----------------- | ------------------ |
| `payment_id`  | string (UUID)     | 결제 식별자        |
| `order_id`    | string (UUID)     | 연결된 주문 식별자 |
| `user_id`     | string (UUID)     | 결제 요청 사용자   |
| `amount`      | integer           | 확정 금액 (KRW)    |
| `captured_at` | string (ISO 8601) | 매출 확정 시각     |

### PaymentFailed

- 발행 시점: 결제 실패 시
- idempotency key: `payment:{payment_id}:failed`
- payload:

| 필드           | 타입              | 설명               |
| -------------- | ----------------- | ------------------ |
| `payment_id`   | string (UUID)     | 결제 식별자        |
| `order_id`     | string (UUID)     | 연결된 주문 식별자 |
| `failure_code` | string (enum)     | 실패 코드          |
| `failed_at`    | string (ISO 8601) | 실패 시각          |

### PaymentCancelled

- 발행 시점: 결제 취소 시 (매출 확정 전 취소)
- idempotency key: `payment:{payment_id}:cancelled`
- payload:

| 필드           | 타입              | 설명               |
| -------------- | ----------------- | ------------------ |
| `payment_id`   | string (UUID)     | 결제 식별자        |
| `order_id`     | string (UUID)     | 연결된 주문 식별자 |
| `reason`       | string            | 취소 사유          |
| `cancelled_at` | string (ISO 8601) | 취소 시각          |

### PaymentRefunded

- 발행 시점: 환불 완료 시 (전액 또는 부분)
- idempotency key: `payment:{payment_id}:refunded`
- payload:

| 필드            | 타입              | 설명                        |
| --------------- | ----------------- | --------------------------- |
| `payment_id`    | string (UUID)     | 결제 식별자                 |
| `order_id`      | string (UUID)     | 연결된 주문 식별자          |
| `refund_amount` | integer           | 환불 금액 (KRW)             |
| `refund_type`   | string (enum)     | `full` 또는 `partial`       |
| `reason`        | string            | 환불 사유                   |
| `refunded_at`   | string (ISO 8601) | 환불 완료 시각              |

## 소비자

| 이벤트           | 소비 도메인   | 용도                       |
| ---------------- | ------------- | -------------------------- |
| PaymentInitiated | observability | 결제 시도 모니터링         |
| PaymentCaptured  | order         | 주문 상태 연동 (confirmed) |
| PaymentCaptured  | loyalty       | 포인트 적립 (pending)      |
| PaymentCaptured  | notification  | 결제 완료 알림             |
| PaymentFailed    | order         | 주문 실패 처리             |
| PaymentFailed    | notification  | 결제 실패 알림             |
| PaymentCancelled | order         | 주문 취소 연동             |
| PaymentCancelled | notification  | 결제 취소 알림             |
| PaymentRefunded  | order         | 주문 환불 상태 연동        |
| PaymentRefunded  | loyalty       | 포인트 적립 롤백           |
| PaymentRefunded  | notification  | 환불 완료 알림             |

## 이벤트 순서 보장

- 동일 `payment_id`에 대한 이벤트 순서는 상태 머신 전이 순서를 따른다.
- 소비자는 이벤트 순서가 보장되지 않는다고 가정하고, 상태 기반으로 멱등 처리해야 한다.
- 예: `PaymentCaptured` 수신 전 `PaymentRefunded`가 도착할 경우, `payment_id`로 현재 상태를 조회하여 처리.

## 소비 이벤트 (Consumed Events)

payment 도메인이 다른 도메인에서 수신하여 처리하는 이벤트 목록.

| 소스 도메인 | 이벤트 | 처리 내용 | 소스 문서 |
| --- | --- | --- | --- |
| `order` | `OrderCreated` | 결제 진행 (`initiated` 상태 생성) | [order/05-events.md](../05-order/05-events.md) |
| `order` | `OrderCancelled` | 결제 취소/환불 처리 | [order/05-events.md](../05-order/05-events.md) |

## 메모

- 이벤트 상세 버전/재시도/DLQ 정책은 `../13-event/01-overview.md`를 따른다.
- `PaymentAuthorized`는 MVP에서 내부 상태 전이로만 사용하며, 외부 이벤트 발행은 보류한다.
- 환불 이벤트 발행 실패 시 outbox 패턴으로 재발행을 보장한다 (`01-overview.md` 장애 복구 정책 참조).
