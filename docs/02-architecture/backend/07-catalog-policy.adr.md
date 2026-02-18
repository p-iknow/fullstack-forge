# ADR-0010: 카탈로그 판매 가능 판정을 상태 + 가용재고 결합 규칙으로 고정

- Status: Accepted
- Date: 2026-02-18
- Decision Makers: Architecture, Backend, Product

## Context

PRD는 카탈로그의 판매 가능 조건을 상품 상태와 재고 가용량으로 동시에 판정하도록 요구한다.
`discontinued`는 구매 불가지만 주문 이력 조회는 유지해야 한다.

## Decision Drivers

- 품절/단종 노출 일관성
- 주문 전 판정 규칙 단순화
- inventory 정책과 충돌 최소화

## Considered Options

1. `status` + `available > 0` 결합 판정
2. `status`만으로 판정
3. `available`만으로 판정

## Decision

옵션 1을 채택한다. 판매 가능은 `status in (active, low_stock)` 이면서 `available > 0`일 때만 허용한다.
단종은 신규 구매를 금지하고 과거 주문 조회만 허용한다.

## Consequences

- Good:
  - 품절/단종 오판정 감소
  - 고객 노출 규칙 명확화
- Bad:
  - 상태-재고 불일치 시 운영 보정 필요

## PRD Traceability

- Satisfies:
  - `docs/01-prd/02-catalog/01-overview.md` (상태/판매조건)
- Supports:
  - `docs/01-prd/03-inventory/01-overview.md` (가용 재고 정의)

## References

- `docs/02-architecture/backend/06-inventory-concurrency.adr.md`
