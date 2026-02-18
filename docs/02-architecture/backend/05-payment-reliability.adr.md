# ADR-0008: 결제 안정성으로 30초 타임아웃 + 주문 단위 멱등 처리 선택

- Status: Accepted
- Date: 2026-02-18
- Decision Makers: Architecture, Backend, Operations

## Context

PRD는 결제 30초 타임아웃, 주문:결제 1:1, 중복 결제 방지를 요구한다.
PG 지연/실패 시 주문 상태와 결제 상태가 불일치하지 않도록 해야 한다.

## Decision Drivers

- 중복 결제 부작용 방지
- 타임아웃 시 사용자/운영자 가시성 확보
- 주문 취소 시 환불 경로 일관성

## Considered Options

1. 주문 단위 idempotency key + 30초 timeout fail-fast
2. 타임아웃 없이 PG 최종 응답까지 대기
3. 결제 재시도 무제한 허용

## Decision

옵션 1을 채택한다. 결제 요청은 주문 단위 멱등 키를 강제하고 30초 내 응답 미수신 시 `failed_timeout`으로 종료한다.
결제는 MVP에서 주문당 1건으로 고정하고, 취소/환불은 주문 보상 시퀀스에 종속한다.

## Consequences

- Good:
  - 중복 승인과 이중 차감 위험 감소
  - 타임아웃 기준이 명확해 운영 판단 단순화
- Bad:
  - 느린 PG 환경에서 실패율이 일시 증가할 수 있음

## PRD Traceability

- Satisfies:
  - `docs/01-prd/06-payment/01-overview.md` (타임아웃 30초, 1:1 카디널리티, 중복 방지)
- Supports:
  - `docs/01-prd/05-order/01-overview.md` (취소 시 환불 연계)
  - `docs/01-prd/13-event/01-overview.md` (신뢰성 운영 기준)

## References

- `docs/02-architecture/backend/03-order-lifecycle.adr.md`
