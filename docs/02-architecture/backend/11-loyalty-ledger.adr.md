# ADR-0014: 포인트는 Ledger SSOT + 계정 잔액 대사 모델로 관리

- Status: Accepted
- Date: 2026-02-18
- Decision Makers: Architecture, Backend, Finance

## Context

PRD는 결제금액 1% 적립, 최소 사용 1,000원, 12개월 만료, 취소 시 롤백을 요구한다.
포인트 잔액 오차를 방지하고 감사 가능한 이력을 유지해야 한다.

## Decision Drivers

- 회계성 추적 가능성
- 취소/환불 시 포인트 정합성
- 만료/운영조정 자동화 기반

## Considered Options

1. Ledger 원장 + 계정 스냅샷(대사 배치)
2. 계정 잔액 단일 테이블 증감
3. 주문 테이블 파생 계산만 사용

## Decision

옵션 1을 채택한다. 포인트 변동은 원장(ledger) 이벤트로 기록하고 계정 잔액은 파생 스냅샷으로 유지한다.
주기적 대사 배치로 ledger 합계와 계정 잔액 불일치를 탐지/보정한다.

## Consequences

- Good:
  - 포인트 변경 이력 감사 가능
  - 취소/환불/만료 처리 정합성 향상
- Bad:
  - 원장/잔액 이중 저장 운영 비용 증가

## PRD Traceability

- Satisfies:
  - `docs/01-prd/09-loyalty/01-overview.md` (1% 적립, 최소 사용, 만료, 롤백)
- Supports:
  - `docs/01-prd/05-order/01-overview.md` (주문 취소 연쇄 효과)

## References

- `docs/02-architecture/backend/03-order-lifecycle.adr.md`
