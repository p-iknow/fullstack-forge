# ADR-0003: API 계약을 TypeSpec -> OpenAPI로 관리

- Status: Accepted
- Date: 2026-02-15
- Decision Makers: Architecture, Backend, Frontend

## Context

PRD 범위는 인증/주문/리뷰/문의/운영 API를 포함한다.
Store/Admin/API가 동시에 진화하는 구조에서 계약 불일치를 줄이기 위한 단일 API 계약 기준이 필요하다.

## Decision Drivers

- 계약 변경의 가시성
- 프론트/백 동시 개발 시 타입 안정성
- 산출물(OpenAPI) 기반 도구 연동
- 단계별 검증에서 계약 드리프트 방지

## Considered Options

1. TypeSpec -> OpenAPI (SSOT)
2. OpenAPI 수동 작성
3. 코드 우선(code-first) 생성

## Decision

TypeSpec을 SSOT로 채택하고, OpenAPI를 생성 산출물로 관리한다.
계약 변경은 TypeSpec 변경을 선행하고, 생성 파이프라인으로 프론트/백 타입을 동기화한다.

## Consequences

- Good:
  - 계약 변경 이력과 영향 범위가 명확해짐
  - 프론트/백 타입 불일치 위험 감소
  - OpenAPI 기반 문서/테스트/도구 연동 용이
- Bad:
  - DSL 학습 비용 존재
  - generated 산출물 관리 규칙이 필요

## PRD Traceability

- Satisfies:
  - `docs/prd/05-phased-delivery-plan.md` (단계별 codegen/typecheck 근거)
- Supports:
  - `docs/prd/02-user-flows-and-auth-policy.md` (인증 API 계약)
  - `docs/prd/03-commerce-domain-policy.md` (커머스 API 계약)
  - `docs/prd/04-event-reliability-and-ops-policy.md` (이벤트 연계 API 계약)

## References

- TypeSpec docs: <https://typespec.io/docs/>
- OpenAPI spec: <https://spec.openapis.org/oas/latest.html>
- 내부 근거: `docs/harness/00-overview.md`, `docs/harness/02-packages.md`, `docs/harness/05-integration.md`
