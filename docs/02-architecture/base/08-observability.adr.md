# ADR-0005: 운영 관측 스택으로 Prometheus + Grafana 선택

- Status: Accepted
- Date: 2026-02-15
- Decision Makers: Architecture, Operations

## Context

PRD는 API 지연/오류, queue depth, worker 실패율, DLQ 메시지, 문의 응답 지연을
지표로 관리하고 임계치 기반 알림을 요구한다.

## Decision Drivers

- SLO/SLA 기반 운영 가능성
- API/Worker/Event를 하나의 지표 체계로 통합
- 로컬부터 클라우드까지 동일 운영 모델

## Considered Options

1. Prometheus + Grafana
2. Cloud provider managed metrics only
3. 로그 중심 모니터링만 사용

## Decision

Prometheus + Grafana를 기본 관측 스택으로 채택한다.
필수 지표와 알림 임계치를 PRD 정책에 맞춰 표준화하고,
traceId 기반 상호 연계를 운영 표준으로 둔다.

## Consequences

- Good:
  - 지표 수집/시각화/알림 구조가 표준화됨
  - API/Queue/Worker 단일 대시보드 구성 가능
  - 로컬 검증과 운영 전환이 단순함
- Bad:
  - 초기 대시보드/알림 튜닝 비용 존재
  - 지표 카디널리티 관리 규칙 필요

## PRD Traceability

- Satisfies:
  - `docs/01-prd/13-event/01-overview.md` (필수 지표/임계치)
- Supports:
  - `docs/01-prd/00-overview.md` (운영 복구/응답 KPI)
  - `docs/01-prd/README.md` (Stage 6~7 운영 검증)

## References

- Prometheus getting started: <https://prometheus.io/docs/prometheus/latest/getting_started/>
- Grafana docs: <https://grafana.com/docs/>
- 내부 근거: `docs/02-architecture/base/01-overview.md`, `docs/01-prd/13-event/01-overview.md`
