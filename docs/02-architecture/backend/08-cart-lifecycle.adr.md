# ADR-0011: 장바구니 라이프사이클을 TTL 만료 + 단방향 전환으로 관리

- Status: Accepted
- Date: 2026-02-18
- Decision Makers: Architecture, Backend

## Context

PRD는 장바구니 TTL 7일, 주문 전환 시 `converted`, 만료 시 `expired` 전이를 요구한다.
만료 또는 전환 이후 재사용을 차단해 중복 주문/재고 오염을 방지해야 한다.

## Decision Drivers

- cart -> order 전환 일관성
- 만료 시 예약 재고 즉시 해제
- 비로그인 게스트 장바구니 미지원(MVP)

## Considered Options

1. 상태 머신(`active/converted/expired`) + TTL 만료 작업
2. cart soft-delete만 사용
3. 무기한 장바구니 유지

## Decision

옵션 1을 채택한다. Cart는 활성 상태에서만 항목 CRUD를 허용한다.
주문 생성 시 즉시 `converted`로 고정하고, 비활성 7일 초과 시 `expired`로 전이하며 예약 재고를 해제한다.

## Consequences

- Good:
  - 장바구니 재사용/중복 전환 버그 감소
  - 재고 복원 시점이 명확해짐
- Bad:
  - TTL 배치/스케줄러 운영 부담 증가

## PRD Traceability

- Satisfies:
  - `docs/01-prd/04-cart/01-overview.md` (TTL, 상태 전이, 주문 전환)
- Supports:
  - `docs/01-prd/03-inventory/01-overview.md` (예약 해제)
  - `docs/01-prd/05-order/01-overview.md` (주문 항목 전환)

## References

- `docs/02-architecture/backend/06-inventory-concurrency.adr.md`
