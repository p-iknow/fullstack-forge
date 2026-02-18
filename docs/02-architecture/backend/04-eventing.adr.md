# ADR-0004: 이벤트 신뢰성 구조로 SNS -> SQS fanout + DLQ + Idempotency 선택

- Status: Accepted
- Date: 2026-02-15
- Decision Makers: Architecture, Backend, Operations

## Context

PRD는 주문 이벤트를 notifications/inventory/dispatch로 fanout하고,
중복 처리 방지와 DLQ 복구 운영을 요구한다.
메시지 전달 실패/중복/지연을 운영 가능한 형태로 설계해야 한다.

## Decision Drivers

- 생산자/소비자 결합도 최소화
- 소비자 독립 확장
- 실패 격리와 재처리 가능성
- at-least-once 환경에서 부작용 방지

## Considered Options

1. SNS -> SQS fanout + DLQ + consumer idempotency
2. 단일 큐 + 다중 소비자
3. 동기 API 체인 호출

## Decision

옵션 1을 채택한다.
API는 SNS로 이벤트를 발행하고, 각 도메인 소비자는 SQS 큐를 독립 소비한다.
각 소비자는 `idempotency:{consumer}:{eventId}` 키로 멱등 처리를 강제한다.
DLQ와 redrive 운영 절차를 표준화한다.

## Consequences

- Good:
  - fanout 구조에서 소비자 독립 배포/확장 가능
  - 장애가 큐 단위로 격리되어 운영 안정성 향상
  - DLQ 기반 재처리로 복구 경로 확보
- Bad:
  - at-least-once 특성으로 멱등성 구현이 필수
  - 운영 복잡도(redrive/runbook/알림) 증가

## PRD Traceability

- Satisfies:
  - `docs/01-prd/13-event/01-overview.md` (fanout/idempotency/DLQ/redrive)
- Supports:
  - `docs/01-prd/00-overview.md` (신뢰성 KPI)
  - `docs/01-prd/README.md` (Stage 4~5 검증)

## References

- AWS SNS->SQS: <https://docs.aws.amazon.com/sns/latest/dg/sns-sqs-as-subscriber.html>
- AWS SQS DLQ: <https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html>
- 내부 근거: `docs/02-architecture/base/01-overview.md`, `docs/01-prd/13-event/01-overview.md`
