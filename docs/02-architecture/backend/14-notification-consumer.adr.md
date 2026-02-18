# ADR-0017: 알림은 fanout 소비자 분리 + 이벤트 멱등 소비로 처리

- Status: Accepted
- Date: 2026-02-18
- Decision Makers: Architecture, Backend

## Context

PRD는 in-app 알림 중심 MVP, notifications 큐 독립 소비, 동일 이벤트 중복 알림 생성 방지를 요구한다.
주문/배송/리뷰 관련 알림은 본 주문 처리 경로와 분리되어야 한다.

## Decision Drivers

- 주문 처리와 알림 처리 결합도 최소화
- 중복 알림 방지
- 채널 확장(push/email/SMS) 가능성 확보

## Considered Options

1. notifications 전용 소비자 + `eventId` 멱등 키
2. API 동기 호출로 즉시 알림 생성
3. 도메인별 알림 구현 중복

## Decision

옵션 1을 채택한다. 알림은 notifications 큐 전용 소비자가 비동기 처리하고 `eventId` 기반 멱등 소비를 강제한다.
MVP 채널은 in-app만 지원하되 채널 라우팅 확장 포인트를 이벤트 소비 결과 단계에 둔다.

## Consequences

- Good:
  - 주문 핵심 경로 지연 최소화
  - 중복 소비에서도 사용자 알림 일관성 유지
- Bad:
  - 이벤트 지연 시 알림 반영 지연 가능

## PRD Traceability

- Satisfies:
  - `docs/01-prd/12-notification/01-overview.md` (독립 소비자, 중복 방지)
  - `docs/01-prd/13-event/01-overview.md` (fanout, idempotency)
- Supports:
  - `docs/01-prd/14-observability/01-overview.md` (소비 지연/DLQ 관측)

## References

- `docs/02-architecture/backend/04-eventing.adr.md`
