# Promotion Events

## 범위

프로모션 도메인의 최소 이벤트 타입을 정의한다.
이벤트 엔벨로프 공통 규격은 `../13-event/01-overview.md`를 따른다.

## 이벤트 타입

- `CouponRedeemed`
- `PromotionApplied`

## 이벤트별 역할

- `CouponRedeemed`
  - 쿠폰 사용 시 발행
  - 소비자: order(할인 적용), loyalty(포인트 연동)
  - payload 필드 개요
    - `coupon_id`: 쿠폰 식별자
    - `user_id`: 사용자 식별자
    - `order_id`: 주문 식별자
    - `discount_amount`: 할인 금액
    - `redeemed_at`: 쿠폰 사용 시각
- `PromotionApplied`
  - 프로모션 적용 시 발행
  - 소비자: order(할인 적용), notification(할인 적용 알림)
  - payload 필드 개요
    - `promotion_id`: 프로모션 식별자
    - `order_id`: 주문 식별자
    - `discount_amount`: 할인 금액
    - `applied_at`: 프로모션 적용 시각

## 운영 규칙

- 이벤트 상세 스키마는 공통 엔벨로프 규격과 버전 정책을 따른다
- 멱등성 키, 재시도, DLQ/redrive 규칙은 [이벤트 인프라 운영 정책](../13-event/01-overview.md)을 따른다
