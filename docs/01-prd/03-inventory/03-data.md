# Inventory Data

## Inventory 엔터티

| 필드 | 타입 | 필수 | 기본값 | 제약 | 설명 |
| --- | --- | --- | --- | --- | --- |
| `product_id` | UUID (PK) | Y | - | FK → Product. UNIQUE | 상품 식별자 |
| `on_hand` | integer | Y | `0` | `0 ≤ on_hand ≤ 999,999` | 총 재고 |
| `reserved` | integer | Y | `0` | `0 ≤ reserved ≤ on_hand` | 주문 예약 재고 |
| `version` | integer | Y | `1` | `≥ 1`, 매 갱신 시 +1 | 낙관적 락 버전 |
| `created_at` | timestamp | Y | `now()` | - | 레코드 생성 시각 |
| `updated_at` | timestamp | Y | `now()` | 매 갱신 시 자동 업데이트 | 마지막 수정 시각 |

### 파생 값

- `available = on_hand - reserved`
- `available`은 저장 컬럼이 아닌 계산 값으로 취급한다.
- `status`는 `available` 기반으로 조회 시 계산한다:
  - `available > safety_threshold(5)` → `normal`
  - `0 < available ≤ safety_threshold(5)` → `low_stock`
  - `available == 0` → `out_of_stock`

### 인덱스

- `product_id`: Primary Key (UNIQUE)
- `(on_hand - reserved)` 또는 application-level 필터: 저재고/품절 목록 조회 성능 지원

### 관계

- `Product` (1:1) — `product_id`는 `Product.id`를 참조한다. 상품 생성 시 inventory 레코드가 자동 생성된다 (`ProductCreated` 이벤트 소비).

---

## InventoryAdjustmentLog 엔터티

운영자 수동 조정 이력을 기록한다. UI 상세 패널의 "최근 조정 이력 요약"과 감사 추적에 사용된다.

| 필드 | 타입 | 필수 | 기본값 | 제약 | 설명 |
| --- | --- | --- | --- | --- | --- |
| `id` | UUID (PK) | Y | - | - | 조정 이력 식별자 |
| `product_id` | UUID | Y | - | FK → Inventory.product_id | 대상 상품 |
| `delta` | integer | Y | - | `≠ 0` | 조정 수량 (양수=입고, 음수=차감) |
| `on_hand_before` | integer | Y | - | - | 조정 전 on_hand |
| `on_hand_after` | integer | Y | - | - | 조정 후 on_hand |
| `reason` | string | Y | - | 1~200자 | 조정 사유 |
| `adjusted_by` | UUID | Y | - | FK → User.id | 조정 실행자 |
| `idempotency_key` | UUID | Y | - | UNIQUE | 중복 조정 방지 키 |
| `created_at` | timestamp | Y | `now()` | - | 조정 시각 |

### 인덱스

- `id`: Primary Key
- `product_id + created_at DESC`: 상품별 최근 조정 이력 조회
- `idempotency_key`: UNIQUE (중복 방지)

---

## 상태 전이 규칙

- 주문 생성: `reserved` 증가
- 주문 취소/결제 실패: `reserved` 감소(복원)
- 배송 확정: `reserved` 감소와 함께 `on_hand` 차감 확정
- 운영자 조정: `on_hand` 직접 변경 (입고/보정), `InventoryAdjustmentLog` 기록

## 동시성 제어

> 동시성 정책의 원문은 [01-overview.md § 동시성 규칙](./01-overview.md#동시성-규칙-정책-원문)을 참조한다.
> 이 섹션은 데이터 모델 관점의 적용 요약만 기술한다.

- `version` 컬럼을 낙관적 락 키로 사용
- 고경합 SKU 판별 시 row lock 전환 (기준: 동일 SKU 3건/초 초과)

## 무결성 규칙

- 모든 전이 후 `on_hand >= 0`
- 모든 전이 후 `reserved >= 0`
- 모든 전이 후 `available >= 0` (즉, `on_hand >= reserved`)
- `on_hand ≤ 999,999`
- `delta ≠ 0` (adjust 시)

## 삭제 정책

- Inventory 레코드는 soft delete하지 않는다. 상품이 비활성화(`is_active=false`)되어도 재고 레코드는 유지한다.
- 상품 삭제(`ProductDeleted`) 시 해당 재고 레코드를 hard delete한다. 단, `reserved > 0`인 경우 삭제를 거부한다.
- `InventoryAdjustmentLog`는 감사 목적으로 영구 보존한다.

## 비범위

- 다중 창고 재고 모델은 MVP 범위에서 제외
