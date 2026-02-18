# Inventory Events

## 공통 규격

- 이벤트 엔벨로프 공통 규격은 [13-event/01-overview.md](../13-event/01-overview.md)를 따른다.
- 토픽/키/재시도 정책/멱등성 키는 후속 단계에서 확정한다.

## 이벤트 목록

### InventoryReserved

- 발행 시점: 재고 예약 시 (주문 생성에 의한 `reserved` 증가 완료 후)
- payload:
  - `sku`: 상품 식별자
  - `quantity`: 예약 수량
  - `order_id`: 주문 식별자
  - `reserved_at`: 예약 시각 (ISO 8601)
- 소비자: `order` 도메인

### InventoryReleased

- 발행 시점: 예약 해제 시 (주문 취소/결제 실패에 의한 `reserved` 복원 완료 후)
- payload:
  - `sku`: 상품 식별자
  - `quantity`: 해제 수량
  - `order_id`: 주문 식별자
  - `released_at`: 해제 시각 (ISO 8601)
- 소비자: `order` 도메인

### InventoryDeducted

- 발행 시점: 재고 차감 확정 시 (배송 확정에 의한 `on_hand` 차감 완료 후)
- payload:
  - `sku`: 상품 식별자
  - `quantity`: 차감 수량
  - `order_id`: 주문 식별자
  - `deducted_at`: 차감 시각 (ISO 8601)
- 소비자: `order` 도메인

### InventoryAdjusted

- 발행 시점: 운영자 재고 조정 시 (수동 입고/보정/차감 완료 후)
- payload:
  - `sku`: 상품 식별자
  - `delta`: 조정 수량 (양수=입고, 음수=차감)
  - `reason`: 조정 사유
  - `adjusted_by`: 조정 실행자 식별자
- 소비자: `notification` 도메인
