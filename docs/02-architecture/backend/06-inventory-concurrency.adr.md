# ADR-0009: 재고 정합성으로 Optimistic Lock 기본 + 고경합 SKU Row Lock 선택

- Status: Accepted
- Date: 2026-02-18
- Decision Makers: Architecture, Backend

## Context

PRD는 안전재고 5개, 예약/해제/차감 전이, 음수 재고 금지, 고경합 시 직렬화 정책을 요구한다.
주문/장바구니/배송이 동시에 재고를 갱신하므로 동시성 제어가 핵심이다.

## Decision Drivers

- 음수 재고 방지
- 고경합 구간에서 일관성 우선
- 일반 구간 처리량 유지

## Considered Options

1. 기본 Optimistic Lock + 임계치 초과 SKU에 Row Lock
2. 전 SKU Row Lock 고정
3. 최종 일관성 기반 비동기 보정

## Decision

옵션 1을 채택한다. 기본은 version 조건의 낙관적 락과 3회 재시도를 사용한다.
동일 SKU 동시 요청이 3건/초를 초과하면 트랜잭션 내 Row Lock으로 직렬화한다.

## Consequences

- Good:
  - 일반 트래픽 성능과 정합성 균형 확보
  - 고경합 구간에서 oversell 위험 완화
- Bad:
  - 경합 판단/전환 로직 운영 복잡도 증가

## PRD Traceability

- Satisfies:
  - `docs/01-prd/03-inventory/01-overview.md` (동시성 규칙, 음수 재고 금지)
- Supports:
  - `docs/01-prd/04-cart/01-overview.md` (TTL 만료 시 예약 해제)
  - `docs/01-prd/05-order/01-overview.md` (주문 취소/부분 취소 복원)

## References

- `docs/02-architecture/backend/03-order-lifecycle.adr.md`
