# ADR-0007: 주문 라이프사이클을 상태 머신 + 보상 트랜잭션으로 관리

- Status: Accepted
- Date: 2026-02-18
- Decision Makers: Architecture, Backend

## Context

PRD는 주문 상태 머신, 부분 취소, 대체상품 정책, 취소 시 연쇄 효과(재고/결제/포인트/배송/알림)를 요구한다.
불법 전이를 API와 DB 양쪽에서 차단해야 한다.

## Decision Drivers

- 상태 전이 무결성 보장
- 부분 실패 시 보상 절차 표준화
- 도메인 간 일관된 취소/복원 순서

## Considered Options

1. 명시적 상태 머신 + 전이 가드 + 보상 시퀀스
2. 서비스별 자유 전이 + 사후 정합성 점검
3. 워크플로 엔진 완전 분리

## Decision

옵션 1을 채택한다. 주문은 명시적 상태 머신으로 관리하고, 불법 전이는 저장 계층에서 재차 차단한다.
취소는 재고 복원 -> 결제 취소/환불 -> 포인트 롤백 -> 배송 취소 -> 알림 순으로 보상 시퀀스를 고정한다.

## Consequences

- Good:
  - 상태 무결성과 운영 예측 가능성 향상
  - 부분 취소/대체상품 정책 구현 기준 명확화
- Bad:
  - 도메인 간 보상 순서 관리 비용 증가

## PRD Traceability

- Satisfies:
  - `docs/01-prd/05-order/01-overview.md` (상태 머신, 대체상품, 취소 연쇄)
- Supports:
  - `docs/01-prd/03-inventory/01-overview.md` (예약/복원 연계)
  - `docs/01-prd/06-payment/01-overview.md` (취소/환불 연계)

## References

- `docs/02-architecture/backend/01-backend.md`
