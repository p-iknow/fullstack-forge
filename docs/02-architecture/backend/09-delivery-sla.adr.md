# ADR-0012: 배송 운영은 SLA 계산 필드 + 재배차 경보 경로로 표준화

- Status: Accepted
- Date: 2026-02-18
- Decision Makers: Architecture, Backend, Operations

## Context

PRD는 즉시/예약 배송 모드별 SLA 기준과 배차 실패 재시도 정책을 요구한다.
운영자는 SLA 위반 위험 주문을 사전에 식별하고 개입할 수 있어야 한다.

## Decision Drivers

- SLA 위반 조기 탐지
- 배차 실패 시 운영 개입 경로 표준화
- 주문 상태와 배송 상태 분리 관리

## Considered Options

1. `sla_target_at`/`sla_window` 필드 기반 판정 + 재배차 경보
2. 배송 완료 후 사후 SLA 집계만 수행
3. 외부 배차 시스템에 SLA 책임 완전 위임

## Decision

옵션 1을 채택한다. 배송 엔티티에 SLA 계산 필드를 저장하고 상태 전이 시 위험도를 업데이트한다.
배차 연속 실패(2회)는 운영 경보를 발생시키고 수동 개입 큐로 전환한다.

## Consequences

- Good:
  - 위반 전 선제 대응 가능
  - 운영 대시보드 기준 지표 일관성 확보
- Bad:
  - 상태 전이마다 SLA 재계산 비용 발생

## PRD Traceability

- Satisfies:
  - `docs/01-prd/07-delivery/01-overview.md` (SLA 계산, 상태 머신, 재배차)
- Supports:
  - `docs/01-prd/14-observability/01-overview.md` (알림 임계치/운영 지표)

## References

- `docs/02-architecture/base/08-observability.adr.md`
