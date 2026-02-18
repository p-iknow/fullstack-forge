# ADR-0016: 문의 운영은 상태 머신 + 24시간 응답 SLA 타이머로 관리

- Status: Accepted
- Date: 2026-02-18
- Decision Makers: Architecture, Backend, Operations

## Context

PRD는 문의 상태 전이(`open -> in_progress -> resolved -> closed`), 재오픈(`resolved -> open`), 24시간 1차 응답 SLA를 요구한다.
운영자 작업 큐와 SLA 위반 위험 주문/문의를 함께 관리해야 한다.

## Decision Drivers

- SLA 위반 사전 경고
- 재오픈 정책 일관성
- 권한 기반 상태 전이 통제

## Considered Options

1. 상태 머신 + SLA 타이머 필드 + 운영 큐 정렬
2. 상태 문자열 업데이트만 수행
3. 외부 티켓 도구로 완전 위임

## Decision

옵션 1을 채택한다. 문의는 상태 머신으로 전이하고, 생성 시점 기준 SLA 타이머를 부여한다.
재오픈 전이는 고객 본인 요청으로만 허용하며 `closed`에서는 재오픈을 금지한다.

## Consequences

- Good:
  - SLA 관리와 재오픈 정책이 자동화됨
  - 운영 우선순위 큐 구성 기준 명확화
- Bad:
  - 타이머/큐 정렬 로직 추가 구현 필요

## PRD Traceability

- Satisfies:
  - `docs/01-prd/11-inquiry/01-overview.md` (상태 전이, 재오픈, 24시간 SLA)
- Supports:
  - `docs/01-prd/14-observability/01-overview.md` (문의 응답 지표)

## References

- `docs/02-architecture/base/08-observability.adr.md`
