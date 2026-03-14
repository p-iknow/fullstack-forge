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
- 동시성: `version` (낙관적 락용, 수정 시 증가)
- 감사: `created_at`, `updated_at`

### Cart Status Enum

| 값          | 설명                                  | 전이 가능 상태         |
| ----------- | ------------------------------------- | ---------------------- |
| `active`    | 활성 장바구니. 항목 CRUD 가능         | `converted`, `expired` |
| `converted` | 주문 전환 완료. 재사용 불가           | 종료 상태              |
| `expired`   | TTL 초과로 만료. 장바구니 항목만 정리 | 종료 상태              |

## 3) CartItem 엔터티

- 식별: `cart_item_id`
- 소속: `cart_id`
- 대상 상품: `product_id`, `sku`
- 수량: `quantity`
- 가격 스냅샷: `unit_price_snapshot` — 항목 추가 시점의 상품 가격 기록. 상품 가격 변경 시 기존 스냅샷은 갱신하지 않으며, 주문 전환 시 최신 가격과 비교하여 차이가 있으면 사용자에게 고지한다.
- 선택 정보: `is_substitutable` — 상품 추가 시 해당 상품의 `is_substitutable` 속성을 복사. 장바구니에서 사용자가 변경할 수 없으며, 주문 전환 시 대체상품 정책에 전달.
- 감사: `created_at`, `updated_at`

## 4) 관계

- `Cart 1 : N CartItem`
- `CartItem N : 1 Product(SKU)`
- `User 1 : 0..1 Cart(active)` — 사용자당 활성 장바구니 최대 1개

## 5) 도메인 규칙 반영

- 수량 제한 규칙은 `CartItem.quantity` 변경 시점마다 검증한다.
- 장바구니 최대 항목 수(30개)는 `CartItem` 추가 시점에 검증한다.
- 동일 `product_id` 재추가 시 기존 항목의 수량을 합산한다(upsert).
- TTL 만료 시 `Cart.status`를 `expired`로 전환하고 연관 `CartItem`은 주문 생성 대상에서 제외한다. 장바구니는 재고를 예약하지 않으므로, 만료 시 재고 관련 처리는 발생하지 않는다.
- 주문 전환 시 `Cart.status`를 `converted`로 전환하고, 해당 장바구니에 대한 항목 변경을 거부한다.
- 수정 시 `Cart.version`을 증가시켜 낙관적 락 충돌을 감지한다.

## 6) 데이터 보존 정책

- `active` 장바구니: TTL 만료까지 유지.
- `converted`/`expired` 장바구니: 상태 변경 후 90일간 보존. 이후 배치로 soft delete 처리한다.
- soft delete 된 데이터는 추가 90일간 보관 후 영구 삭제한다.
- 분석 목적으로 장바구니 전환/만료 이력은 별도 분석 저장소에 보관할 수 있다(MVP 이후).
