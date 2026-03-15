## 포인트 이벤트 정의

본 문서는 적립 포인트 도메인에서 발행·소비하는 이벤트 계약을 정의한다.
이벤트 엔벨로프 공통 규격은 `../13-event/01-overview.md`를 따른다.

---

## 발행 이벤트

loyalty 도메인이 발행하는 이벤트 목록.

| 이벤트           | 발행 시점           | 주요 소비자  | 멱등성 키                        |
| ---------------- | ------------------- | ------------ | -------------------------------- |
| `PointsEarned`   | 포인트 적립 확정 시 | notification | `PointsEarned:{ledger_id}`       |
| `PointsRedeemed` | 포인트 사용 시      | notification | `PointsRedeemed:{redemption_id}` |
| `PointsExpired`  | 포인트 만료 시      | notification | `PointsExpired:{ledger_id}`      |
| `PointsAdjusted` | 운영자 수동 조정 시 | notification | `PointsAdjusted:{ledger_id}`     |

### 큐 라우팅

- SNS Topic: 공통 도메인 이벤트 토픽 (`domain-events`)
- SQS 소비: `notifications` 큐에서 소비 (알림 발송 용도)

### PointsEarned

- **발행 시점**: `pending → available` 전환 완료 시 (배송 완료 확인 후)
- **소비자**: notification — 적립 확정 알림 발송
- **페이로드**:

| 필드         | 타입      | 필수 | 설명                               |
| ------------ | --------- | ---- | ---------------------------------- |
| `user_id`    | `UUID`    | Y    | 대상 사용자 식별자                 |
| `ledger_id`  | `UUID`    | Y    | 원장 항목 식별자                   |
| `amount`     | `integer` | Y    | 적립 포인트 (양수)                 |
| `order_id`   | `UUID`    | Y    | 연관 주문 식별자                   |
| `earned_at`  | `string`  | Y    | 적립 시각 (ISO 8601)               |
| `expires_at` | `string`  | Y    | 만료 예정 시각 (ISO 8601, +12개월) |

### PointsRedeemed

- **발행 시점**: 주문 결제에서 포인트가 차감 완료될 때
- **소비자**: notification — 포인트 사용 알림 발송

> **참고**: 포인트 사용은 `POST /loyalty/redeem` 동기 API로 처리되므로, order 도메인은 API 응답으로 결과를 수신한다. 별도 비동기 이벤트 소비 불필요.

- **페이로드**:

| 필드            | 타입      | 필수 | 설명                 |
| --------------- | --------- | ---- | -------------------- |
| `user_id`       | `UUID`    | Y    | 대상 사용자 식별자   |
| `redemption_id` | `UUID`    | Y    | 사용 이력 식별자     |
| `amount`        | `integer` | Y    | 사용 포인트 (양수)   |
| `order_id`      | `UUID`    | Y    | 연관 주문 식별자     |
| `redeemed_at`   | `string`  | Y    | 사용 시각 (ISO 8601) |

### PointsExpired

- **발행 시점**: 만료 배치가 유효기간 경과 포인트를 소멸 처리할 때
- **소비자**: notification — 만료 안내 알림 발송
- **페이로드**:

| 필드         | 타입      | 필수 | 설명                      |
| ------------ | --------- | ---- | ------------------------- |
| `user_id`    | `UUID`    | Y    | 대상 사용자 식별자        |
| `ledger_id`  | `UUID`    | Y    | 원장 항목 식별자          |
| `amount`     | `integer` | Y    | 만료 포인트 (양수)        |
| `expired_at` | `string`  | Y    | 만료 처리 시각 (ISO 8601) |

### PointsAdjusted

- **발행 시점**: 운영자가 포인트를 수동 가감할 때
- **소비자**: notification — 조정 내역 알림 발송
- **페이로드**:

| 필드          | 타입      | 필수 | 설명                          |
| ------------- | --------- | ---- | ----------------------------- |
| `user_id`     | `UUID`    | Y    | 대상 사용자 식별자            |
| `ledger_id`   | `UUID`    | Y    | 원장 항목 식별자              |
| `delta`       | `integer` | Y    | 조정량 (양수=가산, 음수=차감) |
| `reason`      | `string`  | Y    | 조정 사유                     |
| `adjusted_by` | `UUID`    | Y    | 조정 운영자 식별자            |
| `adjusted_at` | `string`  | Y    | 조정 시각 (ISO 8601)          |

---

## 소비 이벤트

loyalty 도메인이 외부 도메인으로부터 소비하는 이벤트 목록.

| 이벤트                                           | 발행 도메인 | 소비 시 동작                        | 멱등성 키                    |
| ------------------------------------------------ | ----------- | ----------------------------------- | ---------------------------- |
| `PaymentCaptured`                                | payment     | `pending` 포인트 적립 (ledger 생성) | `loyalty:earn:{order_id}`    |
| `DeliveryStatusChanged` (`new_status=delivered`) | delivery    | `pending → available` 전환          | `loyalty:confirm:{order_id}` |
| `OrderCancelled`                                 | order       | 적립 rollback + 사용 포인트 복원    | `loyalty:cancel:{order_id}`  |
| `CouponRedeemed`                                 | promotion   | 적립 기준 금액에서 할인액 차감 반영 | `loyalty:coupon:{order_id}`  |

### PaymentCaptured 소비

- **발행 도메인**: `../06-payment/05-events.md`
- **소비 동작**:
  1. 실결제 금액 계산: `payment.amount - coupon_discount - point_discount`
  2. 적립 기준 금액이 5,000원 미만이면 적립 skip
  3. 포인트 계산: `FLOOR(실결제 금액 × 0.01)`
  4. `PointLedger` 레코드 생성 (`status=pending`, `source_type=order_payment`)
  5. `LoyaltyAccount.pending_balance` 증가
- **실패 처리**: 재시도 3회 후 DLQ 이동. 포인트 미적립은 대사 배치에서 탐지.

### DeliveryStatusChanged (`new_status=delivered`) 소비

- **발행 도메인**: `../07-delivery/05-events.md` (`DeliveryStatusChanged` 이벤트 중 `new_status=delivered`인 경우)
- **소비 동작**:
  1. 해당 `order_id`의 `pending` 상태 ledger 조회
  2. `status`를 `available`로 전환
  3. `LoyaltyAccount`: `pending_balance` 감소, `available_balance` 증가
  4. `PointsEarned` 이벤트 발행
- **실패 처리**: 재시도 3회 후 DLQ 이동. 전환 실패 시 포인트는 `pending` 상태 유지.

### OrderCancelled 소비

- **발행 도메인**: `../05-order/01-overview.md`
- **소비 동작**:
  1. 해당 `order_id`의 `pending`/`available` 포인트 조회
  2. 적립분 rollback: `order_cancel` source_type으로 역방향 ledger 기록
  3. 사용 포인트 복원: `PointRedemption.status = restored`, `available_balance` 복원
  4. `LoyaltyAccount` 잔액 갱신
- **부분 취소**: `partially_cancelled` 시 취소 아이템 금액 비례 차감 (상세: `01-overview.md` 부분 취소 정책)
- **실패 처리**: 재시도 3회 후 DLQ 이동. 포인트 미복원은 대사 배치에서 탐지.

### CouponRedeemed 소비

- **발행 도메인**: `../08-promotion/05-events.md`
- **소비 동작**: 적립 기준 금액 산정 시 쿠폰 할인액을 차감하여 실결제 금액을 보정.
  - 이 이벤트는 `PaymentCaptured`보다 먼저 도착하거나 동시 도착할 수 있으므로, 적립 계산은 `PaymentCaptured` 소비 시점에 쿠폰 할인 정보를 참조하여 일괄 처리.
  - `CouponRedeemed` 단독으로는 포인트 변동을 발생시키지 않음. 할인 메타데이터 저장 용도.
- **실패 처리**: 재시도 3회 후 DLQ 이동. 미수신 시 `PaymentCaptured`의 payment.amount 기준으로 적립 (할인 미반영).

---

## 운영 규칙

### 재시도 정책

- 모든 소비 이벤트는 `../13-event/01-overview.md` §4의 SQS 재시도 정책을 따른다.
- `VisibilityTimeout`: 90초, `maxReceiveCount`: 3
- 3회 실패 시 DLQ 이동

### DLQ 처리

- DLQ 메시지는 원인 분석 후 수동 redrive (admin 권한)
- 동일 오류 반복 시 자동 redrive 금지

### 이벤트 순서 보장

- 이벤트 순서는 보장하지 않는다.
- `PaymentCaptured` → `DeliveryStatusChanged`(`new_status=delivered`) 순서가 역전될 수 있으므로, `DeliveryStatusChanged`(`new_status=delivered`) 수신 시 해당 `order_id`의 `pending` ledger가 없으면 skip 후 `PaymentCaptured` 소비 시점에서 재시도.
- 멱등성 키로 중복 처리를 방지한다.

### 이벤트 버전 정책

- 이벤트 상세 스키마는 구현 단계에서 TypeSpec/Zod 계약으로 확정한다.
- `schemaVersion` 필드를 포함하여 하위 호환성 유지.
- 소비자는 최소 2개 버전까지 backward compatible 권장.
