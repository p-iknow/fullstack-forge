# Cart API Guide

## 1) 목적

- store 장바구니 기본 동작에 필요한 cart CRUD 엔드포인트 경로와 책임을 정의한다.
- 이 문서는 엔드포인트 가이드만 다루며 request/response body 스키마는 포함하지 않는다.

## 2) 기본 경로

- Base: `/api/store/cart`
- 식별자: `cart_item_id`

## 3) 조회 API

- `GET /api/store/cart`
  - 목적: 현재 사용자 장바구니 조회
  - 포함: 항목, 수량, 만료 예정 시각, 장바구니 상태(`active`, `converted`, `expired`)

## 4) 생성/수정 API

- `POST /api/store/cart/items`
  - 목적: 상품을 장바구니에 추가
  - 규칙: 아이템 수량은 장바구니 정책의 최대 수량을 초과할 수 없다.
  - 전제: 장바구니 상태가 `active`인 경우에만 허용한다. `converted` 또는 `expired` 상태에서는 거부한다.
- `PATCH /api/store/cart/items/{cart_item_id}`
  - 목적: 장바구니 항목 수량 변경
  - 규칙: 0 이하는 허용하지 않으며 삭제 API를 사용한다.

## 5) 삭제 API

- `DELETE /api/store/cart/items/{cart_item_id}`
  - 목적: 단일 장바구니 항목 삭제
- `DELETE /api/store/cart`
  - 목적: 장바구니 전체 비우기

## 6) 주문 전환 흐름

- 주문 생성 API(`POST /api/store/orders`) 호출 시 장바구니 → 주문 전환이 발생한다.
- 전환 절차:
  1. 장바구니 상태가 `active`인지 검증한다.
  2. 장바구니 항목을 주문 항목으로 복사한다.
  3. 장바구니 상태를 `converted`로 변경한다.
  4. `CartConverted` 이벤트를 발행한다.
- 전환 완료 후 해당 장바구니에 대한 변경 요청은 `409 Conflict`로 거부한다.

## 7) 운영 규칙

- 비활성 TTL 만료 시 장바구니는 자동 만료 처리한다.
- 만료 또는 항목 해제 시 재고 예약 상태는 inventory 정책에 맞춰 복원한다.
