# Cart API Guide

## 1) 목적

- store 장바구니 기본 동작에 필요한 cart CRUD 엔드포인트 경로와 책임을 정의한다.
- request/response body 상세 스키마는 `packages/api-spec`에서 TypeSpec으로 정의하며, 이 문서는 엔드포인트 가이드와 정책만 다룬다.

## 2) 기본 경로

- Base: `/api/store/cart`
- 식별자: `cart_item_id`
- 인증: 모든 cart API는 인증된 사용자 전용이다. 미인증 요청은 `401 Unauthorized`로 거부한다.
- 권한: 사용자는 자신의 장바구니만 접근할 수 있다. 타 사용자 장바구니 접근 시 `403 Forbidden`으로 거부한다.

## 3) 조회 API

- `GET /api/store/cart`
  - 목적: 현재 사용자 장바구니 조회
  - 포함: 항목, 수량, 만료 예정 시각, 장바구니 상태(`active`, `converted`, `expired`)
  - 실시간 재고 확인: 각 항목의 현재 재고 상태(`in_stock`, `low_stock`, `out_of_stock`)를 inventory에서 조회하여 응답에 포함한다.

## 4) 생성/수정 API

- `POST /api/store/cart/items`
  - 목적: 상품을 장바구니에 추가
  - 규칙: 아이템 수량은 장바구니 정책의 최대 수량을 초과할 수 없다.
  - 전제: 장바구니 상태가 `active`인 경우에만 허용한다. `converted` 또는 `expired` 상태에서는 거부한다.
  - 중복 처리: 동일 `product_id`가 이미 장바구니에 존재하면 기존 항목의 수량을 합산한다(upsert). 합산 결과가 아이템당 최대 수량(15)을 초과하면 거부한다.
  - 판매 불가 상품: `product.is_active = false`, `category.is_active = false`, 또는 `available == 0`인 상품은 추가를 거부한다.
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
  2. 품절 항목이 포함되어 있으면 전환을 거부한다.
  3. 각 항목의 `unit_price_snapshot`과 현재 상품 가격을 비교하여 차이가 있으면 사용자에게 고지한다.
  4. 장바구니 항목을 주문 항목으로 복사한다.
  5. 장바구니 상태를 `converted`로 변경한다.
  6. 트랜잭션 커밋 후 `CartConverted` 이벤트를 발행한다.
- 전환 완료 후 해당 장바구니에 대한 변경 요청은 `409 Conflict`로 거부한다.
- 트랜잭션 실패 시 장바구니는 `active` 상태를 유지한다.

## 7) 에러 응답

| 상황                                      | HTTP 코드                   | 설명                                               |
| ----------------------------------------- | --------------------------- | -------------------------------------------------- |
| 미인증 요청                               | `401 Unauthorized`          | 로그인 필요                                        |
| 타 사용자 장바구니 접근                    | `403 Forbidden`             | 본인 장바구니만 접근 가능                          |
| 장바구니/항목 없음                         | `404 Not Found`             | 존재하지 않는 cart 또는 cart_item_id                |
| 수량 유효성 실패 (0 이하, 15 초과)         | `400 Bad Request`           | 수량 정책 위반                                     |
| 장바구니 항목 수 초과 (30개)               | `400 Bad Request`           | 최대 항목 수 정책 위반                             |
| 판매 불가 상품 추가                        | `422 Unprocessable Entity`  | 비활성/품절 상품 추가 시도                         |
| converted/expired 장바구니 변경            | `409 Conflict`              | 종료 상태 장바구니에 변경 시도                     |
| 동시성 충돌 (version mismatch)             | `409 Conflict`              | 낙관적 락 충돌, 최신 상태와 함께 반환              |
| 품절 항목 포함 주문 전환                   | `422 Unprocessable Entity`  | 품절 항목 제거 후 재시도 필요                      |

## 8) 운영 규칙

- 비활성 TTL 만료 시 장바구니는 배치로 자동 만료 처리한다.
- 장바구니는 재고를 예약하지 않으므로, 만료 시 재고 관련 처리는 발생하지 않는다.
