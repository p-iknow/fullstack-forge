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
  - 인증: 불필요 (내부 네트워크 제한으로 보안 확보)
  - 포함 항목: `01-overview.md §6 필수 지표` 전체를 노출한다. API 서비스는 API/서비스 지표 및 비즈니스 지표를, Worker 서비스는 이벤트/큐 지표 및 운영/복구 지표를 각각 노출한다.

## 2) Admin Dashboard API

모든 admin 엔드포인트는 `admin` 권한을 요구하며, 미인증/미인가 시 `401`/`403`을 반환한다.

- `GET /admin/observability/overview`
  - 목적: 핵심 지표 카드와 상태 요약을 조회한다.
  - 에러: `401` 미인증, `403` 권한 없음, `502` Prometheus 연결 실패

- `GET /admin/observability/queues`
  - 목적: 큐별 적체/처리율/실패율을 조회한다.
  - 쿼리 파라미터: `window` (집계 윈도우: `5m|1h|24h`, 기본 `5m`)
  - 에러: `401`, `403`, `502`

- `GET /admin/observability/alerts`
  - 목적: 현재 알림 규칙과 최근 발생 이력을 조회한다.
  - 쿼리 파라미터: `status` (필터: `active|resolved|all`, 기본 `all`), `page` (기본 1), `limit` (기본 20, 최대 100)
  - 에러: `401`, `403`

- `POST /admin/observability/alerts/rules`
  - 목적: 알림 임계치 규칙을 생성 또는 갱신한다 (upsert).
  - 필수 필드: `metric` (메트릭명), `threshold` (임계치 수값), `window` (관찰 윈도우), `channels` (알림 채널 배열)
  - 검증 규칙: `metric`은 `01-overview.md §6 필수 지표`에 정의된 메트릭만 허용. `threshold`는 양수. `window`는 `1m|5m|15m|1h` 중 택 1. `channels`는 1개 이상 필수.
  - 에러: `400` 검증 실패 (필드별 오류 메시지 포함), `401`, `403`

- `GET /admin/observability/traces/{traceId}`
  - 목적: traceId 기준 이벤트 처리 흐름을 조회한다.
  - 에러: `401`, `403`, `404` 해당 traceId 없음

- `GET /admin/observability/audit/redrive`
  - 목적: redrive 수행 감사 로그를 조회한다.
  - 쿼리 파라미터: `from` (시작 시각, ISO 8601), `to` (종료 시각, ISO 8601), `executor` (실행자 필터), `result` (성공/실패 필터: `success|failure|all`, 기본 `all`), `page` (기본 1), `limit` (기본 20, 최대 100)
  - 에러: `400` 잘못된 시간 범위, `401`, `403`

## 3) 권한/운영 원칙

- 관리자 전용 경로는 `admin` 권한으로 제한한다.
- 관측 API는 운영 판단용 조회를 우선하며 비즈니스 상태 변경을 직접 수행하지 않는다.
- redrive 자체 실행 API는 이벤트 도메인 운영 경로를 따른다.
- `/metrics` 엔드포인트는 네트워크 수준 접근 제어로 보호하며 애플리케이션 인증을 적용하지 않는다.

## 4) 비범위

- request/response body 스키마 정의
- 비운영 사용자(store)의 관측 API 접근
