# Order Events

## 범위

주문 도메인의 발행 이벤트, 소비자, 수신 이벤트를 정의한다.
이벤트 엔벨로프 공통 규격은 `../13-event/01-overview.md`를 따른다.

## 발행 이벤트

### OrderCreated

- 발행 시점: 주문 생성 완료 시 (`POST /orders` 성공 후)
- 멱등성 키: `order_id`
- payload:
  - `order_id`: string (UUID) — 주문 식별자
  - `user_id`: string (UUID) — 주문자 식별자
  - `status`: string — 생성 직후 상태 (`created`)
  - `items`: array — 주문 아이템 요약
    - `order_item_id`: string (UUID)
    - `sku_id`: string (UUID)
    - `quantity`: integer
    - `unit_price`: integer (원)
    - `is_substitutable`: boolean
  - `total_amount`: integer (원) — 최종 결제 금액
  - `created_at`: string (ISO 8601) — 주문 생성 시각

#### 소비자

| 소비 도메인  | 용도                              |
| ------------ | --------------------------------- |
| inventory    | 재고 예약 (`reserved` 증가)       |
| payment      | 결제 진행 (`initiated` 상태 생성) |
| notification | 주문 생성 알림 발송               |

### OrderStatusChanged

- 발행 시점: 주문 상태 변경 시 (`PATCH /orders/:id/status` 성공 후, 취소 제외)
- 멱등성 키: `order_id` + `changed_at`
- payload:
  - `order_id`: string (UUID) — 주문 식별자
  - `previous_status`: string — 변경 전 주문 상태
  - `current_status`: string — 변경 후 주문 상태
  - `changed_by`: string (UUID) — 전이 수행 주체 식별자
  - `changed_by_role`: string — 전이 수행 주체 역할 (`customer`, `operator`, `system`)
  - `reason`: string | null — 전이 사유
  - `changed_at`: string (ISO 8601) — 상태 변경 시각

#### 소비자

| 소비 도메인   | 용도                                          |
| ------------- | --------------------------------------------- |
| delivery      | 배송 상태 연동 (`dispatched`, `delivered` 등) |
| notification  | 상태 변경 알림 발송                           |
| observability | 상태 전이 메트릭 수집                         |

### OrderCancelled

- 발행 시점: 주문 전체 취소 또는 부분 취소 시 (`status`가 `cancelled` 또는 `partially_cancelled`로 전이될 때)
- 멱등성 키: `order_id` + `cancelled_at`
- payload:
  - `order_id`: string (UUID) — 주문 식별자
  - `user_id`: string (UUID) — 주문자 식별자
  - `cancel_type`: string — `full` (전체 취소) 또는 `partial` (부분 취소)
  - `cancelled_items`: array — 취소 대상 아이템 목록
    - `order_item_id`: string (UUID)
    - `sku_id`: string (UUID)
    - `quantity`: integer
    - `unit_price`: integer (원)
  - `refund_amount`: integer (원) — 환불 대상 금액
  - `points_to_restore`: integer (원) — 복원 대상 포인트
  - `reason`: string — 취소 사유
  - `cancelled_by`: string (UUID) — 취소 수행 주체
  - `cancelled_by_role`: string — `customer`, `operator`, `system`
  - `cancelled_at`: string (ISO 8601) — 취소 시각

#### 소비자

| 소비 도메인  | 용도                                |
| ------------ | ----------------------------------- |
| inventory    | 재고 예약 해제 (`reserved` 감소)    |
| payment      | 결제 취소/환불 처리                 |
| loyalty      | 포인트 롤백 (적립 회수 + 사용 복원) |
| delivery     | 배송 취소                           |
| notification | 취소 완료 알림 발송                 |

### SubstitutionRequested

- 발행 시점: 대체상품 승인 요청 생성 시 (가격 120% 초과)
- 멱등성 키: `substitution_id`
- payload:
  - `substitution_id`: string (UUID) — 대체 레코드 식별자
  - `order_id`: string (UUID) — 주문 식별자
  - `user_id`: string (UUID) — 주문자 식별자
  - `original_sku_id`: string (UUID) — 원본 SKU
  - `substitute_sku_id`: string (UUID) — 대체 SKU
  - `price_diff`: integer (원) — 가격 차이
  - `expires_at`: string (ISO 8601) — 승인 만료 시각
  - `requested_at`: string (ISO 8601) — 요청 시각

#### 소비자

| 소비 도메인  | 용도                                  |
| ------------ | ------------------------------------- |
| notification | 대체 승인 요청 알림 발송 (사용자에게) |

### SubstitutionResolved

- 발행 시점: 대체 승인/거절/타임아웃 처리 완료 시
- 멱등성 키: `substitution_id` + `resolved_at`
- payload:
  - `substitution_id`: string (UUID) — 대체 레코드 식별자
  - `order_id`: string (UUID) — 주문 식별자
  - `resolution`: string — `approved`, `rejected`, `timeout_cancelled`
  - `resolved_at`: string (ISO 8601) — 처리 시각

#### 소비자

| 소비 도메인  | 용도                                |
| ------------ | ----------------------------------- |
| notification | 대체 처리 결과 알림 발송            |
| inventory    | 거절/타임아웃 시 대체 SKU 예약 해제 |

## 수신 이벤트 (Inbound)

주문 도메인이 다른 도메인에서 수신하여 처리하는 이벤트 목록.

| 발행 도메인 | 이벤트                  | 주문 도메인 처리                                                |
| ----------- | ----------------------- | --------------------------------------------------------------- |
| cart        | `CartConverted`         | 장바구니 전환 후속 처리 확인                                    |
| payment     | `PaymentCaptured`       | `created` → `confirmed` 전이                                    |
| payment     | `PaymentFailed`         | `created` → `cancelled` 전이 + 재고 해제 트리거                 |
| payment     | `PaymentCancelled`      | 결제 취소 상태 반영                                             |
| delivery    | `DeliveryStatusChanged` | 배송 상태에 따른 주문 상태 연동 (`dispatched` → `delivered` 등) |
| loyalty     | `PointsRedeemed`        | 포인트 사용 금액 주문에 반영                                    |
| promotion   | `CouponRedeemed`        | 쿠폰 할인 적용 반영                                             |
| promotion   | `PromotionApplied`      | 프로모션 할인 적용 반영                                         |

## 운영 규칙

- 이벤트 상세 스키마는 공통 엔벨로프 규격과 버전 정책을 따른다
- 멱등성 키, 재시도, DLQ/redrive 규칙은 [이벤트 인프라 운영 정책](../13-event/01-overview.md)을 따른다
- 수신 이벤트 처리 시 멱등 소비를 보장한다 (`idempotency:{consumer}:{eventId}`)
