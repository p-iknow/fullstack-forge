# Promotion API Guide

## 범위

프로모션 조회·쿠폰 적용·검증 API의 경로와 책임을 정의한다.
이 문서는 경로 가이드와 정책만 다루며 request/response body 스키마는 포함하지 않는다.

## 기본 경로

- Store 쿠폰 적용: `/orders/:id/apply-coupon`
- Store 활성 프로모션 조회: `/promotions/active`
- Store 쿠폰 검증: `/coupons/validate`

## 핵심 API

### `POST /orders/:id/apply-coupon`

- 목적: 주문에 쿠폰 코드를 적용하여 최종 할인을 확정
- 규칙: 주문 시점에 활성 프로모션 후보 조회(기간/상태 필터)
- 규칙: 쿠폰 코드 입력 시 코드 유효성 검증(존재/만료/사용량/사용자별 제한)
- 규칙: 최소주문금액 조건 검증 — **15,000원** 미달 시 거절
- 규칙: 충돌 정책 적용(동시 적용 금지)
- 규칙: 사용자에게 가장 유리한 할인 1개 선택
- 규칙: 선택 결과를 `order_promotions`로 고정 저장

### `GET /promotions/active`

- 목적: 현재 활성 상태인 프로모션 후보 목록 조회
- 규칙: 유효기간·활성상태 필터 기준으로 반환
- 규칙: 만료 프로모션은 목록에서 제외

### `POST /coupons/validate`

- 목적: 쿠폰 코드의 유효성을 사전 검증(적용 전 확인용)
- 규칙: 쿠폰 코드는 대소문자 구분 없이 비교하되 저장은 원본 보존
- 규칙: 만료 쿠폰은 조회는 가능하나 적용 불가
- 규칙: 사용자별 사용 제한(`per_user_limit`) 초과 시 거절
- 규칙: 전체 사용 제한(`max_uses`) 초과 시 거절
- 규칙: 동일 주문에는 동일 쿠폰 재적용 불가

## 실패 사유 코드

- `coupon_not_found`
- `coupon_expired`
- `coupon_limit_exceeded`
- `promotion_min_order_not_met`

## 운영/보안

- 무차별 코드 대입 방지: 사용자/IP 단위 rate limit 적용
- 감사 로그 기록: 쿠폰 적용 성공/실패, 운영자 수동 비활성화, 정책 변경 이력
