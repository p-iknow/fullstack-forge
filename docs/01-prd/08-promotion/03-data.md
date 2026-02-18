# Promotion Data

## 범위

프로모션 도메인의 데이터 모델과 정합성 정책을 정의한다.

## 데이터 모델(운영 시뮬레이션 기준)

- `promotions`: 할인 정책 본체(타입/할인값/유효기간/활성상태)
- `coupons`: 코드 기반 프로모션 세부(코드/사용 한도/유효기간)
- `promotion_categories`: 카테고리 할인 대상 범위
- `coupon_redemptions`: 사용자-주문 단위 쿠폰 사용 이력
- `order_promotions`: 최종 주문에 적용된 할인 결과 스냅샷

## 엔터티별 핵심 필드

- `promotions`: 타입, 할인값, 유효기간, 활성상태, 최소주문금액 조건
- `coupons`: 코드, 사용 한도, 유효기간, per_user_limit, max_uses
- `promotion_categories`: 프로모션 식별자, 카테고리 할인 대상 범위
- `coupon_redemptions`: coupon, user, order, 쿠폰 사용 이력 상태
- `order_promotions`: 주문 식별자, 선택된 할인, selected_by_rule, 할인 결과 스냅샷

## 정합성/동시성 정책

- 사용량 증가는 트랜잭션으로 처리해 초과 발급 방지
- `coupon_redemptions`는 (coupon, user, order) 중복 방지 제약 필요
- 주문 할인 결과는 계산 후 재조회가 아닌 스냅샷 값을 신뢰 원천으로 사용

## 유니크 제약

- coupon 단위 중복 방지
- user 단위 중복 방지
- order 단위 중복 방지
- (coupon, user, order) 조합 중복 방지
