# Observability Domain Events

## 발행 정책

- 관측 도메인은 이벤트 발행 없음.
- observability는 producer가 아니라 수집/시각화/알림/감사 역할에 집중한다.
- 도메인 이벤트의 생성/전파 책임은 event 및 각 비즈니스 도메인에 있다.
- 이벤트 엔벨로프 공통 규격은 `../13-event/01-overview.md`를 참조한다.

## 소비/참조 이벤트 명세

관측 도메인은 이벤트를 직접 구독하지 않으나, 각 서비스가 노출하는 Prometheus 메트릭을 통해 이벤트 처리 결과를 수집한다. 아래는 KPI 산출에 필요한 메트릭의 원천 이벤트 매핑이다.

| 원천 도메인 | 이벤트 / 트리거 | 관련 메트릭 | KPI 연결 |
| --- | --- | --- | --- |
| order | `OrderCreated` 발행 시 | `order_created_total` | 주문 성공률 |
| order | 주문 `delivered` 전이 시 | `order_completed_total` | 주문 성공률, 리뷰 전환율 |
| order | `GET /orders` 요청 시 | `api_request_duration_seconds{handler="/orders"}` | p95 주문 조회 지연 |
| event | consumer 처리 시 멱등 키 중복 감지 | `duplicate_event_skipped_total` | 중복 처리 오류 |
| event | DLQ redrive 실행 시 | `dlq_redrive_total`, `dlq_redrive_success_total` | DLQ 복구 성공률 |
| event | consumer 처리 완료/실패 시 | `worker_processed_total`, `worker_failed_total` | 운영 복구 시간 |
| review | 리뷰 생성 시 | `review_created_total` | 리뷰 작성 전환율 |
| review | 리뷰 신고 처리 시 | `review_moderation_count` | — |
| inquiry | 운영자 1차 응답 시 | `inquiry_first_response_latency` | 문의 1차 응답 시간 |

> 각 서비스는 위 메트릭을 `/metrics` 경로에 Prometheus exposition format으로 노출해야 한다. 관측 도메인은 이를 스크레이프하여 대시보드와 알림에 활용한다.
