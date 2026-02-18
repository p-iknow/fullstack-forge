# Observability Domain API Guide

이 문서는 observability 도메인의 API 목적과 운영 가이드를 정의한다.
request/response body 스키마는 이 문서에 포함하지 않는다.

## 범위

- 메트릭 수집 엔드포인트(`/metrics`) 노출 정책
- admin 관측 대시보드 조회/알림 설정 API 가이드
- 운영 감사/추적 조회 API 가이드

## 1) Metrics Endpoint

- `GET /metrics`
  - 목적: Prometheus scrape 대상 메트릭을 제공한다.
  - 노출 대상: API 서버, worker, 이벤트 소비자 처리 지표.
  - 보안 원칙: 외부 공개가 아닌 운영 네트워크 또는 내부 접근 경로로 제한한다.
  - 최소 포함 항목: `queue_depth`, `worker_processed_total`, `worker_failed_total`, `event_processing_latency`, `dlq_message_count`, `inquiry_first_response_latency`, `review_moderation_count`.

## 2) Admin Dashboard API (가이드 수준)

- `GET /admin/observability/overview`
  - 목적: 핵심 지표 카드와 상태 요약을 조회한다.
- `GET /admin/observability/queues`
  - 목적: 큐별 적체/처리율/실패율을 조회한다.
- `GET /admin/observability/alerts`
  - 목적: 현재 알림 규칙과 최근 발생 이력을 조회한다.
- `POST /admin/observability/alerts/rules`
  - 목적: 알림 임계치 규칙을 생성 또는 갱신한다.
- `GET /admin/observability/traces/{traceId}`
  - 목적: traceId 기준 이벤트 처리 흐름을 조회한다.
- `GET /admin/observability/audit/redrive`
  - 목적: redrive 수행 감사 로그를 조회한다.

## 3) 권한/운영 원칙

- 관리자 전용 경로는 `admin` 권한으로 제한한다.
- 관측 API는 운영 판단용 조회를 우선하며 비즈니스 상태 변경을 직접 수행하지 않는다.
- redrive 자체 실행 API는 이벤트 도메인 운영 경로를 따른다.

## 4) 비범위

- request/response body 스키마 정의
- 비운영 사용자(store)의 관측 API 접근
