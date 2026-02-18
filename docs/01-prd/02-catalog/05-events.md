# Catalog Events

## 1) 공통

- 이벤트 엔벨로프 공통 규격은 `../13-event/01-overview.md`를 따른다.

## 2) ProductStatusChanged

- **발행 시점**: 상품 상태가 변경될 때 (`active ↔ inactive ↔ discontinued`)
- **payload 필드**:

  | 필드         | 타입     | 설명                 |
  | ------------ | -------- | -------------------- |
  | `sku`        | `string` | 대상 상품 SKU 식별자 |
  | `old_status` | `string` | 변경 전 상태         |
  | `new_status` | `string` | 변경 후 상태         |
  | `changed_at` | `string` | 변경 시각 (ISO 8601) |

- **소비자**:
  - inventory — 재고 정책 연동 (품절/단종 시 가용 재고 재계산)
  - notification — 품절 알림 발송
