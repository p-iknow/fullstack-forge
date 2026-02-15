# 04. Event Reliability and Operations Policy

## 1) 이벤트 아키텍처

- Producer: `api`
- Broker: `SNS`
- Queues: `SQS` fanout (`notifications`, `inventory`, `dispatch`)
- Consumers: worker(또는 초기 api 내부 worker)
- 보조 저장소: Redis(idempotency, rate limit, cache)

## 2) 이벤트 계약 정책

### 필수 envelope 필드

- `eventId` (UUID)
- `eventType` (예: `OrderCreated`, `ReviewCreated`, `InquiryCreated`, `InquiryReplied`)
- `schemaVersion` (예: `v1`)
- `occurredAt` (ISO timestamp)
- `traceId`
- `source`
- `payload`

### 도메인 이벤트 최소 범위

- 주문: `OrderCreated`, `OrderStatusChanged`
- 리뷰/댓글: `ReviewCreated`, `ReviewCommentCreated`, `ReviewHiddenByOperator`
- 고객 문의: `InquiryCreated`, `InquiryReplied`, `InquiryStatusChanged`

### 버전 정책

- 호환성 깨지는 변경은 `schemaVersion` 증가 필수
- 소비자는 최소 2개 버전까지 backward compatible 권장

## 3) 소비자 처리 정책

### idempotency

- 키 형식: `idempotency:{consumer}:{eventId}`
- TTL: 7일(기본)
- 이미 처리된 키면 side-effect 실행 없이 ack

### ack 규칙

- side-effect 성공 시 ack/delete
- 실패 시 nack/retry
- maxReceiveCount 초과 시 DLQ 이동

## 4) 재시도/DLQ 정책

### SQS 권장 기본값

- `VisibilityTimeout`: 예상 처리시간의 3~5배
- `maxReceiveCount`: 3~5
- source retention: 1~4일
- DLQ retention: source보다 길게

### redrive 정책

- redrive 전 원인 분석 필수
- 동일 오류 코드 반복 시 자동 redrive 금지
- redrive 실행자는 `admin` 권한 필요

## 5) 장애 유형별 운영 규칙

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

## 6) 관측/알림 정책

### 필수 지표

- `queue_depth`
- `worker_processed_total`
- `worker_failed_total`
- `event_processing_latency`
- `dlq_message_count`
- `inquiry_first_response_latency`
- `review_moderation_count`

### 알림 임계치(기본)

- API 오류율 1% 초과(5분)
- p99 지연 2초 초과(5분)
- DLQ 메시지 5건 초과
- Queue depth 1000 초과

## 7) 감사/추적 정책

- 모든 이벤트 처리 로그에 `traceId`, `eventId`, `consumer` 기록
- 주문 단위 추적 가능해야 함(end-to-end)
- redrive 수행 기록은 별도 감사 로그 필수

## 8) 보안 정책

- queue payload에 민감정보 직접 저장 금지
- PII는 최소화/마스킹
- 운영자 redrive/강제전이는 RBAC로 제한

## 9) 완료 조건

- fanout 3개 queue 처리 성공
- duplicate 이벤트 시 side-effect 중복 0
- DLQ -> redrive 복구 시나리오 성공
- backlog 장애 대응 runbook 리허설 통과
- 리뷰/문의 이벤트 생성/처리/운영 로그 추적 가능
