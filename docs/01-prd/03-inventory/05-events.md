# Inventory Events

## 공통 규격

- 이벤트 엔벨로프 공통 규격은 [13-event/01-overview.md](../13-event/01-overview.md)를 따른다.
- 토픽: SNS `inventory` 토픽으로 발행, SQS fanout으로 소비자에게 분배
- 이벤트 순서 보장: 동일 `product_id` 내에서도 이벤트 순서를 보장하지 않는다. 소비자는 멱등성 키와 타임스탬프를 기준으로 최신 상태를 판별해야 한다.

## 버전 정책

- 모든 이벤트의 초기 `schemaVersion`은 `v1`
- payload 필드 추가는 하위 호환으로 간주 (version 유지)
- 필드 삭제/타입 변경 시 `schemaVersion` 증가 필수

---

## 이벤트 목록

### InventoryReserved

- 발행 시점: 재고 예약 시 (주문 생성에 의한 `reserved` 증가 완료 후)
- 멱등성 키: `order_id + product_id`
- payload:

  | 필드              | 타입              | 설명              |
  | ----------------- | ----------------- | ----------------- |
  | `product_id`      | UUID              | 상품 식별자       |
  | `sku`             | string            | 상품 SKU          |
  | `quantity`        | integer           | 예약 수량         |
  | `order_id`        | UUID              | 주문 식별자       |
  | `available_after` | integer           | 예약 후 가용 수량 |
  | `reserved_at`     | string (ISO 8601) | 예약 시각         |

- 소비자:

  | 소비 도메인 | 용도                                 |
  | ----------- | ------------------------------------ |
  | `order`     | 주문 생성 확인 (재고 예약 성공 반영) |

### InventoryReleased

- 발행 시점: 예약 해제 시 (주문 취소/결제 실패에 의한 `reserved` 복원 완료 후)
- 멱등성 키: `order_id + product_id`
- payload:

  | 필드              | 타입              | 설명              |
  | ----------------- | ----------------- | ----------------- |
  | `product_id`      | UUID              | 상품 식별자       |
  | `sku`             | string            | 상품 SKU          |
  | `quantity`        | integer           | 해제 수량         |
  | `order_id`        | UUID              | 주문 식별자       |
  | `available_after` | integer           | 해제 후 가용 수량 |
  | `released_at`     | string (ISO 8601) | 해제 시각         |

- 소비자:

  | 소비 도메인 | 용도                                 |
  | ----------- | ------------------------------------ |
  | `order`     | 주문 취소 확인 (재고 복원 성공 반영) |

### InventoryDeducted

- 발행 시점: 재고 차감 확정 시 (배송 확정에 의한 `on_hand` 차감 완료 후)
- 멱등성 키: `order_id + product_id`
- payload:

  | 필드            | 타입              | 설명            |
  | --------------- | ----------------- | --------------- |
  | `product_id`    | UUID              | 상품 식별자     |
  | `sku`           | string            | 상품 SKU        |
  | `quantity`      | integer           | 차감 수량       |
  | `order_id`      | UUID              | 주문 식별자     |
  | `on_hand_after` | integer           | 차감 후 총 재고 |
  | `deducted_at`   | string (ISO 8601) | 차감 시각       |

- 소비자:

  | 소비 도메인 | 용도                                 |
  | ----------- | ------------------------------------ |
  | `order`     | 주문 완료 확인 (재고 차감 성공 반영) |

### InventoryAdjusted

- 발행 시점: 운영자 재고 조정 시 (수동 입고/보정/차감 완료 후)
- 멱등성 키: `idempotency_key` (조정 요청의 클라이언트 제공 키)
- payload:

  | 필드            | 타입              | 설명                             |
  | --------------- | ----------------- | -------------------------------- |
  | `product_id`    | UUID              | 상품 식별자                      |
  | `sku`           | string            | 상품 SKU                         |
  | `delta`         | integer           | 조정 수량 (양수=입고, 음수=차감) |
  | `on_hand_after` | integer           | 조정 후 총 재고                  |
  | `reason`        | string            | 조정 사유                        |
  | `adjusted_by`   | UUID              | 조정 실행자 식별자               |
  | `adjusted_at`   | string (ISO 8601) | 조정 시각                        |

- 소비자:

  | 소비 도메인    | 용도                  |
  | -------------- | --------------------- |
  | `notification` | 운영자 재고 조정 알림 |

### InventoryLevelChanged

- 발행 시점: 재고 수준이 임계치를 교차할 때 (reserve/release/deduct/adjust 결과로 상태가 변경될 때)
  - `normal → low_stock`: available이 safety_threshold(5) 미만으로 감소
  - `low_stock → out_of_stock`: available이 0으로 감소
  - `out_of_stock → low_stock`: available이 0 초과로 증가 (재입고)
  - `low_stock → normal`: available이 safety_threshold(5) 이상으로 증가
  - `normal → out_of_stock`: available이 0으로 감소 (대량 예약 등)
  - `out_of_stock → normal`: available이 safety_threshold 이상으로 증가 (대량 입고)
- 멱등성 키: `product_id + changed_at`
- payload:

  | 필드             | 타입              | 설명                                                 |
  | ---------------- | ----------------- | ---------------------------------------------------- |
  | `product_id`     | UUID              | 상품 식별자                                          |
  | `sku`            | string            | 상품 SKU                                             |
  | `previous_level` | string            | 변경 전 상태 (`normal`, `low_stock`, `out_of_stock`) |
  | `current_level`  | string            | 변경 후 상태                                         |
  | `available`      | integer           | 변경 후 가용 수량                                    |
  | `changed_at`     | string (ISO 8601) | 상태 변경 시각                                       |

- 소비자:

  | 소비 도메인    | 용도                                      |
  | -------------- | ----------------------------------------- |
  | `notification` | 품절/재입고 고객 알림, 저재고 운영자 알림 |
  | `cart`         | 활성 장바구니 내 해당 상품 품절 경고 표시 |

---

## 소비 이벤트 (Consumed Events)

inventory 도메인이 다른 도메인에서 발행한 이벤트를 소비하여 처리하는 목록이다.

| 소스 도메인 | 이벤트                  | 처리 내용                                                           | 소스 문서                                             |
| ----------- | ----------------------- | ------------------------------------------------------------------- | ----------------------------------------------------- |
| `catalog`   | `ProductCreated`        | 재고 레코드 자동 생성 (`on_hand=0`, `reserved=0`, `version=1`)      | [catalog/05-events.md](../02-catalog/05-events.md) §2 |
| `catalog`   | `ProductDeactivated`    | 비활성 상품 가용 재고 재계산                                        | [catalog/05-events.md](../02-catalog/05-events.md) §4 |
| `catalog`   | `ProductDeleted`        | 해당 상품 재고 레코드 정리 (`reserved > 0`이면 거부)                | [catalog/05-events.md](../02-catalog/05-events.md) §5 |
| `order`     | `OrderCreated`          | reserve 실행 (주문 아이템별 `reserved` 증가)                        | [order/05-events.md](../05-order/05-events.md)        |
| `order`     | `OrderCancelled`        | 취소 아이템의 `reserved` 복원 (release 실행)                        | [order/05-events.md](../05-order/05-events.md)        |
| `order`     | `SubstitutionResolved`  | 대체 거절/타임아웃 시 대체 SKU 예약 해제                            | [order/05-events.md](../05-order/05-events.md)        |
| `delivery`  | `DeliveryStatusChanged` | new_status=`delivered`일 때 confirm-deduction 실행 (`on_hand` 차감) | [delivery/05-events.md](../07-delivery/05-events.md)  |

---

## DLQ 처리

- 모든 inventory 이벤트는 [13-event/01-overview.md § 재시도/DLQ 정책](../13-event/01-overview.md)의 공통 정책을 따른다.
- `maxReceiveCount`: 3 (3회 소비 실패 시 DLQ 이동)
- DLQ 이동 후 운영자 확인 → 원인 분석 → redrive
