# Event Domain Overview

이 문서는 event 도메인의 공통 운영 정책을 모아 둔 co-located 문서다.

## §1 이벤트 아키텍처

- Producer: `api`
- Broker: `SNS`
- Queues: `SQS` fanout (`notifications`, `inventory`, `dispatch`)
- Consumers: worker(또는 초기 api 내부 worker)
- 보조 저장소: Redis(idempotency, rate limit, cache)
- API는 SNS로 이벤트를 발행하고, 각 도메인 소비자는 SQS 큐를 독립 소비한다.
- DLQ와 redrive 운영 절차를 표준화한다.

### SNS -> SQS fanout 이벤트 흐름(비즈니스 관점)

```mermaid
flowchart LR
  P[Producer(api)] --> T[SNS Topic]
  T --> QN[SQS notifications]
  T --> QI[SQS inventory]
  T --> QD[SQS dispatch]
  QN --> CN[Notifications Worker]
  QI --> CI[Inventory Worker]
  QD --> CD[Dispatch Worker]
```

## §2 이벤트 계약 정책

### 필수 envelope 필드

- `eventId` (UUID)
- `eventType` (예: `OrderCreated`, `ReviewCreated`, `InquiryCreated`, `InquiryReplied`)
- `schemaVersion` (예: `v1`)
- `occurredAt` (ISO timestamp)
- `traceId`
- `source`
- `payload`

### 버전 정책

- 호환성 깨지는 변경은 `schemaVersion` 증가 필수
- 소비자는 최소 2개 버전까지 backward compatible 권장

## §3 소비자 처리 정책

### idempotency

- 키 형식: `idempotency:{consumer}:{eventId}`
- TTL: 7일(기본)
- 이미 처리된 키면 side-effect 실행 없이 ack

### ack 규칙

- side-effect 성공 시 ack/delete
- 실패 시 nack/retry
- 수신 횟수 한도 초과 시 DLQ 이동

## §4 재시도/DLQ 정책

### SQS 확정 운영값

- `VisibilityTimeout`: 90초(처리시간 30초 x 3배)
- `maxReceiveCount`: 3
- source queue retention: 4일
- DLQ retention: 14일

### redrive 정책

- redrive 전 원인 분석 필수
- 동일 오류 코드 반복 시 자동 redrive 금지
- redrive 실행자는 `admin` 권한 필요

## §5 장애 유형별 운영 규칙

### 유형 A: Poison Message

- 증상: 특정 메시지 반복 실패
- 조치:
  1. DLQ 메시지 payload 점검
  2. 코드/데이터 원인 수정
  3. 단건 redrive 후 재검증

### 유형 B: Queue Backlog 급증

- 증상: visible messages 급증
- 조치:
  1. consumer 처리율/오류율 확인
  2. scale-out 또는 publish 제한
  3. SLA 영향 주문 우선 처리

### 유형 C: 외부 의존 장애(결제/OAuth)

- 조치:
  1. circuit breaker/open 상태 전환
  2. fallback 응답 제공
  3. 복구 후 재처리 정책 적용

## §8 보안 정책

- queue payload에 민감정보 직접 저장 금지
- PII는 최소화/마스킹
- 운영자 redrive/강제전이는 RBAC로 제한

## Stage 4 + Stage 5 Gate

### Stage 4 — Event Fanout

#### 구현 목표

- `OrderCreated` 발행
- SQS fanout consumer 3개 처리

#### 학습 목표

- pub/sub 설계와 소비자 분리
- 이벤트 계약(version/envelope)

#### Exit Criteria

- 주문 1건 -> queue 3개 도착
- consumer 독립 처리 확인

#### Evidence

- queue 수신 결과
- event envelope 샘플

### Stage 5 — Reliability

#### 구현 목표

- idempotency key 적용
- DLQ/redrive 운영 루프 구축

#### 학습 목표

- at-least-once 안전성 확보
- 장애 복구 runbook 운영

#### Exit Criteria

- duplicate 이벤트 side-effect 0
- DLQ 이동 및 redrive 성공

#### Evidence

- duplicate 테스트 기록
- redrive 실행 로그
