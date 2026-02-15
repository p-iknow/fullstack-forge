# ADR Index

이 디렉토리는 PRD 요구사항을 만족하기 위해 현재 스택을 선택한 이유를 기록하는
Architecture Decision Records(ADR) 단일 기준이다.

## ADR 목록

1. [ADR-0000: ADR 규칙과 추적성](./ADR-0000-adr-conventions-and-traceability.md)
2. [ADR-0001: Frontend Stack (TanStack Start)](./ADR-0001-frontend-stack-tanstack-start.md)
3. [ADR-0002: Backend Stack (Hono + Drizzle + PostgreSQL + Redis)](./ADR-0002-backend-stack-hono-drizzle-postgres-redis.md)
4. [ADR-0003: Contract-first API (TypeSpec -> OpenAPI)](./ADR-0003-contract-first-typespec-openapi.md)
5. [ADR-0004: Event Reliability (SNS -> SQS + DLQ + Idempotency)](./ADR-0004-eventing-sns-sqs-dlq-idempotency.md)
6. [ADR-0005: Observability (Prometheus + Grafana)](./ADR-0005-observability-prometheus-grafana.md)

## 읽는 순서

- 전체 규칙: ADR-0000
- 동기 요청 경계: ADR-0001, ADR-0002, ADR-0003
- 비동기/운영 경계: ADR-0004, ADR-0005

## PRD 추적

- PRD 범위: `docs/prd/01-product-scope.md` ~ `docs/prd/05-phased-delivery-plan.md`
