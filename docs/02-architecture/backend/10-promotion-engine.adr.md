# ADR-0013: 프로모션 계산은 단일 선택 엔진 + 스냅샷 저장으로 고정

- Status: Accepted
- Date: 2026-02-18
- Decision Makers: Architecture, Backend, Product

## Context

PRD는 최소주문금액 15,000원, 쿠폰/카테고리 할인 충돌 해소, 동시성 안전한 사용량 증가를 요구한다.
주문 완료 후 재계산 없이 할인 결과를 재현 가능해야 한다.

## Decision Drivers

- 할인 결과 재현성
- 쿠폰 오남용/초과 사용 방지
- 충돌 정책의 일관된 사용자 경험

## Considered Options

1. 단일 우선순위 엔진(최대 할인 1개) + `order_promotions` 스냅샷
2. 다중 할인 중첩 허용
3. 주문 조회 시 동적 재계산

## Decision

옵션 1을 채택한다. 할인은 주문 시점에 후보를 평가하고 최대 이익 1개만 선택한다.
결과는 `order_promotions` 스냅샷으로 고정 저장하며, 동일 할인액 충돌은 쿠폰 우선 규칙을 적용한다.

## Consequences

- Good:
  - 주문 시점 할인 결과 재현 가능
  - 충돌 정책 예측 가능성 향상
- Bad:
  - 정책 변경 시 과거 주문 재해석이 어려움

## PRD Traceability

- Satisfies:
  - `docs/01-prd/08-promotion/01-overview.md` (최소주문금액, 충돌 정책, 스냅샷 저장)
- Supports:
  - `docs/01-prd/05-order/01-overview.md` (주문 합계 계산/대체 흐름)

## References

- `docs/02-architecture/backend/03-order-lifecycle.adr.md`
