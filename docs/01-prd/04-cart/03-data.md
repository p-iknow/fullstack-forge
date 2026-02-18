# Cart Data Model

## 1) 목적

- cart 도메인의 핵심 엔터티와 관계를 정의한다.
- 이 문서는 엔터티 책임과 필드 의미를 다루며 컬럼 타입/인덱스 정의는 포함하지 않는다.

## 2) Cart 엔터티

- 식별: `cart_id`
- 소유: `user_id`
- 상태: `status` → Cart Status Enum 참조
- 만료 기준: `expires_at`
- 활동 기준: `last_active_at`
- 감사: `created_at`, `updated_at`

### Cart Status Enum

| 값          | 설명                                  | 전이 가능 상태         |
| ----------- | ------------------------------------- | ---------------------- |
| `active`    | 활성 장바구니. 항목 CRUD 가능         | `converted`, `expired` |
| `converted` | 주문 전환 완료. 재사용 불가           | 종료 상태              |
| `expired`   | TTL 초과로 만료. reserved 재고 해제됨 | 종료 상태              |

## 3) CartItem 엔터티

- 식별: `cart_item_id`
- 소속: `cart_id`
- 대상 상품: `product_id`, `sku`
- 수량: `quantity`
- 가격 스냅샷: `unit_price_snapshot`
- 선택 정보: `is_substitutable`
- 감사: `created_at`, `updated_at`

## 4) 관계

- `Cart 1 : N CartItem`
- `CartItem N : 1 Product(SKU)`

## 5) 도메인 규칙 반영

- 수량 제한 규칙은 `CartItem.quantity` 변경 시점마다 검증한다.
- 장바구니 최대 항목 수(30개)는 `CartItem` 추가 시점에 검증한다.
- TTL 만료 시 `Cart.status`를 `expired`로 전환하고 연관 `CartItem`은 주문 생성 대상에서 제외한다.
- 주문 전환 시 `Cart.status`를 `converted`로 전환하고, 해당 장바구니에 대한 항목 변경을 거부한다.
- 만료 처리 시 inventory의 reserved 해제 흐름과 동일 트랜잭션 경계를 유지한다.
