# ADR-0000: ADR 규칙과 추적성

- Status: Accepted
- Date: 2026-02-15
- Decision Makers: Architecture

## Context

PRD는 요구사항을 정의하고, ADR은 "왜 이 기술/구조를 선택했는지"를 기록해야 한다.
기존 문서에는 스택 근거가 분산되어 있어 의사결정 이력을 일관되게 조회하기 어렵다.

## Decision Drivers

- PRD 요구사항과 기술 선택의 직접 연결
- 대안 비교와 트레이드오프 기록
- 변경 시 supersede 가능한 이력 구조
- 팀 내 재사용 가능한 동일 템플릿

## Considered Options

1. ARD 단일 문서에 계속 누적
2. ADR 디렉토리 분리 + 번호 기반 기록

## Decision

옵션 2를 채택한다. `docs/02-architecture/`에 계층별 `.adr.md` 파일을 생성하고,
`docs/02-architecture/README.md`와 각 ADR의 `PRD Traceability` 섹션을 ADR 인덱스/추적 요약 기준으로 사용한다.

## Consequences

- Good:
  - 의사결정 단위가 분리되어 변경 이력 추적이 쉬움
  - PRD 변경 시 영향 ADR 식별이 쉬움
- Bad:
  - 문서 수가 늘어 유지비가 증가
  - ADR 간 링크 관리 필요

## ADR Template Rules

모든 ADR은 아래 섹션을 포함한다.

1. Context
2. Decision Drivers
3. Considered Options
4. Decision
5. Consequences
6. PRD Traceability
7. References

## PRD Traceability Rules

- 각 ADR은 최소 2개 이상의 PRD 문서를 참조한다.
- "Satisfies"와 "Supports"를 분리한다.
- 구현 절차는 ADR이 아니라 `docs/01-prd/README.md`에서 관리한다.

## References

- MADR: <https://adr.github.io/madr/>
- Nygard ADR: <https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions>
- GOV.UK ADR Framework: <https://www.gov.uk/government/publications/architectural-decision-record-framework/architectural-decision-record-framework>
