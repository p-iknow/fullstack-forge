# Catalog Events

## 1) 공통

- 이벤트 엔벨로프 공통 규격은 `../13-event/01-overview.md`를 따른다.

## 2) ProductCreated

- **발행 시점**: admin에서 신규 상품을 등록할 때
- **payload 필드**:

  | 필드          | 타입      | 설명                          |
  | ------------- | --------- | ----------------------------- |
  | `product_id`  | `string`  | 생성된 상품 ID                |
  | `sku`         | `string`  | 상품 SKU 식별자               |
  | `category_id` | `string`  | 소속 카테고리 ID              |
  | `price`       | `integer` | 가격 (KRW)                    |
  | `created_at`  | `string`  | 생성 시각 (ISO 8601)          |

- **소비자**:
  - inventory — 재고 레코드 자동 생성 (`on_hand=0`, `reserved=0`)

## 3) ProductUpdated

- **발행 시점**: admin에서 상품 정보(이름, 가격, 카테고리, 대체 가능 여부 등)를 수정할 때
- **payload 필드**:

  | 필드             | 타입     | 설명                                                              |
  | ---------------- | -------- | ----------------------------------------------------------------- |
  | `product_id`     | `string` | 대상 상품 ID                                                      |
  | `sku`            | `string` | 상품 SKU 식별자                                                   |
  | `changes`        | `array`  | 변경 항목 목록 (`[{ field, old_value, new_value }]`), 감사 추적용 |
  | `updated_at`     | `string` | 수정 시각 (ISO 8601)                                              |

- **소비자**:
  - cart — 가격 변경 시 활성 장바구니의 해당 상품 가격 갱신 판단

## 4) ProductDeactivated

- **발행 시점**: admin이 상품을 비활성화할 때 (`is_active: true → false`)
- **payload 필드**:

  | 필드            | 타입      | 설명                 |
  | --------------- | --------- | -------------------- |
  | `product_id`    | `string`  | 대상 상품 ID         |
  | `sku`           | `string`  | 대상 상품 SKU 식별자 |
  | `deactivated_at`| `string`  | 비활성화 시각 (ISO 8601) |

- **발행 주체**:
  - admin 수동 변경 — `PATCH /admin/products/:id/active`
- **소비자**:
  - inventory — 비활성 상품 가용 재고 재계산
  - cart — 비활성 전환 시 활성 장바구니 내 해당 상품 경고 표시
- **참고**: 재고 표시 상태(`in_stock`/`low_stock`/`out_of_stock`)는 조회 시 계산되므로 별도 이벤트를 발행하지 않는다. 품절 관련 알림은 inventory 도메인의 `InventoryLevelChanged` 이벤트를 notification이 직접 소비한다.

## 5) ProductDeleted

- **발행 시점**: admin에서 상품을 삭제할 때 (주문 이력 없는 상품만 삭제 가능)
- **payload 필드**:

  | 필드         | 타입     | 설명                 |
  | ------------ | -------- | -------------------- |
  | `product_id` | `string` | 삭제된 상품 ID       |
  | `sku`        | `string` | 삭제된 상품 SKU      |
  | `deleted_at` | `string` | 삭제 시각 (ISO 8601) |

- **소비자**:
  - inventory — 해당 상품 재고 레코드 정리
  - cart — 활성 장바구니에서 해당 상품 제거 및 사용자 알림

## 6) CategoryDeactivated

- **발행 시점**: admin에서 카테고리 `is_active`를 `false`로 변경할 때
- **payload 필드**:

  | 필드            | 타입     | 설명                    |
  | --------------- | -------- | ----------------------- |
  | `category_id`   | `string` | 비활성화된 카테고리 ID  |
  | `slug`          | `string` | 카테고리 slug           |
  | `changed_at`    | `string` | 변경 시각 (ISO 8601)    |

- **소비자**:
  - catalog (자체) — 해당 카테고리 소속 상품의 판매 가능 여부 재평가 (§4 판매 조건 flowchart 참조)

## 7) Inventory → Catalog 연동 (수신 이벤트)

- 재고 표시 상태(`in_stock`/`low_stock`/`out_of_stock`)는 조회 시 inventory의 가용 수량으로 계산되므로, catalog 도메인이 `InventoryLevelChanged` 이벤트를 수신하여 상품 상태를 갱신할 필요가 없다.
- 품절/재입고 관련 알림 및 장바구니 경고는 notification/cart 도메인이 `InventoryLevelChanged` 이벤트를 **직접 소비**하여 처리한다.
- `is_active`는 admin 수동 변경만 가능하며, 재고 변동에 의한 자동 전이 대상이 아니다.
