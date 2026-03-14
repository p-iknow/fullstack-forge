# Promotion Events

## 범위

프로모션 도메인의 이벤트 타입, 발행/소비 계약, 라우팅을 정의한다.
이벤트 엔벨로프 공통 규격은 `../13-event/01-overview.md`를 따른다.

## 이벤트 타입

| 이벤트              | 발행 시점                          | 트리거 API                          |
| ------------------- | ---------------------------------- | ----------------------------------- |
| `CouponRedeemed`    | 쿠폰 적용으로 할인 확정 직후       | `POST /orders/:id/apply-coupon`     |
| `PromotionApplied`  | 카테고리 할인 적용으로 할인 확정 직후 | `POST /orders/:id/apply-coupon`  |

- 하나의 주문에 대해 `CouponRedeemed` 또는 `PromotionApplied` 중 **1개만** 발행 (충돌 정책에 의해 1개 선택)
- 쿠폰이 선택된 경우 `CouponRedeemed`, 카테고리 할인이 선택된 경우 `PromotionApplied`

## 이벤트 발행 상세

### CouponRedeemed

- **발행 시점**: `POST /orders/:id/apply-coupon`에서 쿠폰이 최종 할인으로 선택된 직후, `order_promotions` 스냅샷 저장 완료 후
- **소비자**:
  - `order` — 주문 할인 금액 반영
  - `loyalty` — 할인 후 결제금액 기준 포인트 적립 계산 참조
- **멱등성 키**: `coupon_id:order_id`
- **토픽**: `promotion-events` (SNS)
- **라우팅**: SNS fanout → `order-promotions` 큐, `loyalty-promotions` 큐
- **payload**:

| 필드              | 타입      | 설명             |
| ----------------- | --------- | ---------------- |
| `coupon_id`       | UUID      | 쿠폰 식별자      |
| `promotion_id`    | UUID      | 연결 프로모션     |
| `user_id`         | UUID      | 사용자 식별자     |
| `order_id`        | UUID      | 주문 식별자       |
| `discount_amount` | integer   | 할인 금액 (원)    |
| `redeemed_at`     | timestamp | 쿠폰 사용 시각    |

### PromotionApplied

- **발행 시점**: `POST /orders/:id/apply-coupon`에서 카테고리 할인이 최종 할인으로 선택된 직후, `order_promotions` 스냅샷 저장 완료 후
- **소비자**:
  - `order` — 주문 할인 금액 반영
  - `notification` — 할인 적용 알림 발송
- **멱등성 키**: `promotion_id:order_id`
- **토픽**: `promotion-events` (SNS)
- **라우팅**: SNS fanout → `order-promotions` 큐, `notification-promotions` 큐
- **payload**:

| 필드              | 타입      | 설명              |
| ----------------- | --------- | ----------------- |
| `promotion_id`    | UUID      | 프로모션 식별자    |
| `order_id`        | UUID      | 주문 식별자        |
| `user_id`         | UUID      | 사용자 식별자      |
| `discount_amount` | integer   | 할인 금액 (원)     |
| `discount_type`   | string    | `percentage`       |
| `applied_at`      | timestamp | 프로모션 적용 시각 |

## 소비 이벤트 (타 도메인 발행)

| 소비 이벤트          | 발행 도메인 | 소비 목적                              |
| -------------------- | ----------- | -------------------------------------- |
| `OrderStatusChanged` | order       | 주문 취소/결제 실패 시 쿠폰 롤백 처리  |

### OrderStatusChanged 소비 규칙

- `current_status`가 `cancelled` 또는 결제 실패 상태일 때:
  - 해당 주문의 `coupon_redemptions` 상태를 `rolled_back`으로 전이
  - `coupons.used_count` 감소
  - `order_promotions`에 `rolled_back_at`, `rollback_reason` 기록
- 멱등 처리: `order_id` + `current_status` 조합으로 중복 롤백 방지

## 운영 규칙

- 이벤트 상세 스키마는 공통 엔벨로프 규격과 버전 정책을 따른다
- 멱등성 키, 재시도, DLQ/redrive 규칙은 [이벤트 인프라 운영 정책](../13-event/01-overview.md)을 따른다
- 이벤트 순서 보장: 동일 주문에 대한 이벤트는 `order_id` 기준 파티셔닝으로 순서 유지
- 이벤트 버전: 초기 `v1`, payload 변경 시 `version` 필드로 하위 호환 유지
