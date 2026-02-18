# Payment Events

## 범위

결제 도메인에서 발행하는 이벤트의 최소 계약을 정의한다.
이벤트 엔벨로프 공통 규격은 `../13-event/01-overview.md`를 따른다.

## 이벤트 목록

### PaymentInitiated

- 발행 시점: 결제 요청 시작 시
- payload:
  - `payment_id`: 결제 식별자
  - `order_id`: 연결된 주문 식별자
  - `amount`: 결제 금액
  - `initiated_at`: 결제 시작 시각

### PaymentCaptured

- 발행 시점: 결제 매출 확정(captured) 완료 시
- payload:
  - `payment_id`: 결제 식별자
  - `order_id`: 연결된 주문 식별자
  - `amount`: 확정 금액
  - `captured_at`: 매출 확정 시각

### PaymentFailed

- 발행 시점: 결제 실패 시
- payload:
  - `payment_id`: 결제 식별자
  - `order_id`: 연결된 주문 식별자
  - `failure_code`: 실패 코드 (`failed_timeout`, `failed_gateway`, `failed_insufficient_funds`)
  - `failed_at`: 실패 시각

### PaymentCancelled

- 발행 시점: 결제 취소 시
- payload:
  - `payment_id`: 결제 식별자
  - `order_id`: 연결된 주문 식별자
  - `reason`: 취소 사유
  - `cancelled_at`: 취소 시각

## 소비자

| 이벤트           | 소비 도메인  | 용도           |
| ---------------- | ------------ | -------------- |
| PaymentCaptured  | order        | 주문 상태 연동 |
| PaymentCaptured  | loyalty      | 포인트 적립    |
| PaymentCaptured  | notification | 결제 완료 알림 |
| PaymentFailed    | order        | 주문 실패 처리 |
| PaymentFailed    | notification | 결제 실패 알림 |
| PaymentCancelled | order        | 주문 취소 연동 |
| PaymentCancelled | notification | 결제 취소 알림 |

## 메모

- 이벤트 상세 버전/재시도/DLQ 정책은 `../13-event/01-overview.md`를 따른다.
- `PaymentAuthorized`는 MVP에서 내부 상태 전이로만 사용하며, 외부 이벤트 발행은 보류한다.
