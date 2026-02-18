# Event Domain Data

이 문서는 event 도메인의 저장/추적 데이터 모델을 개념 수준으로 정의한다.

## 1) event_outbox 또는 이벤트 로그 엔터티

- 목적: Producer가 발행한 이벤트를 추적 가능하게 기록한다.
- 역할: 발행 전후 상태, 재시도 이력, trace 연계를 남긴다.
- 공통 식별: `eventId`, `eventType`, `schemaVersion`, `occurredAt`, `traceId`, `source`.
- payload는 이벤트 계약의 `payload`를 그대로 저장한다.

## 2) 소비자 처리 이력 엔터티

- 목적: 소비자별 처리 결과를 감사/운영에 사용한다.
- 기록: `eventId`, `consumer`, 처리 상태, 실패 코드, 처리 시각.
- 운영 요구: 모든 이벤트 처리 로그에 `traceId`, `eventId`, `consumer` 기록.

## 3) idempotency key Redis 패턴

- 키 패턴: `idempotency:{consumer}:{eventId}`
- TTL: 7일(기본)
- 규칙: 이미 처리된 키면 side-effect 실행 없이 ack
- 저장소 역할: Redis(idempotency, rate limit, cache)

## 4) 운영 데이터 연계

- DLQ와 redrive 수행 기록은 별도 감사 로그 필수.
- 주문 단위 추적 가능해야 함(end-to-end).
- duplicate 이벤트 side-effect 0 검증 기록을 남긴다.
- 소비자 이력에는 `receiveCount`와 최종 전이 결과(ack, retry, dlq)를 포함해 재처리 판단 근거를 남긴다.
- source queue 4일, DLQ 14일 보존 기간 내 조회 가능한 감사 쿼리를 제공한다.

## 5) 비목표

- 컬럼 타입을 정의하지 않는다.
- 인덱스 전략을 정의하지 않는다.
