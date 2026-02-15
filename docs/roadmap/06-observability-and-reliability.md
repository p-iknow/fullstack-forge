# 06. Observability and Reliability

## Step Objective

장애를 빠르게 감지하고 원인 파악 -> 복구 -> 재발 방지까지 이어지는
관측/신뢰성 운영 루프를 독립적으로 확립한다.

## Prerequisite

- [05-kubernetes-deploy-and-release](./05-kubernetes-deploy-and-release.md)

## References

- [04-event-reliability-and-ops-policy](../prd/04-event-reliability-and-ops-policy.md)
- [06-tooling](../harness/06-tooling.md)

## Progressive Tasks

### 1) Metrics and Trace Baseline

- 핵심 지표: `queue_depth`, `worker_processed_total`, `worker_failed_total`, `event_processing_latency`, `dlq_message_count`, `inquiry_first_response_latency`, `review_moderation_count`
- API/worker 로그에 `traceId`, `eventId`, `consumer` 표준 필드 적용
- 기본 대시보드(요청량/오류율/큐 적체/DLQ) 구성

### 2) Reliability Control Policy

- idempotency 키 정책: `idempotency:{consumer}:{eventId}`
- DLQ + redrive 운영 절차 수립
- poison message/backlog 대응 runbook 정리

### 3) Failure Response Loop

- 장애 시나리오(consumer crash, 외부 의존 장애, 큐 적체) 정의
- 복구 시간/원인 기록 템플릿 작성
- 임계치/SLO 조정 프로세스 수립

## Local Environment Increment

- 로컬에서 queue depth/실패율/지연 지표를 실제로 수집 가능한 상태로 구성
- 실패 주입 시나리오(consumer crash, DLQ 이동, redrive)를 로컬에서 반복 실행
- 대시보드/알림 규칙을 로컬 기준으로 먼저 튜닝 후 운영 기준으로 승격

## Exit Criteria

- 실패 이벤트를 consumer 단위로 식별 가능
- duplicate/DLQ/redrive 정책이 문서와 구현에서 일치
- 리뷰/문의 운영 지표가 대시보드에서 확인 가능
- 장애 대응 결과가 운영 리포트 형태로 남음

## Evidence

- 대시보드 캡처
- 알림 발생 로그
- 장애 대응 리포트(원인/조치/재발방지)

## Output for Next Step

- 운영 플로우(07)에서 활용할 incident 기준 확정
- 운영 단계(07)에서 사용할 복구/관측 기준 확정
