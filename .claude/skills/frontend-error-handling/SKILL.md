---
name: frontend-error-handling
description: Standardize frontend error handling patterns for sequential async flows and rendering boundaries. Use when users ask about AsyncResult, tryCatchAsync, ky HTTPError, or ErrorBoundary handling in this repository.
---

# Frontend Error Handling

프론트엔드 에러 핸들링 패턴을 일관되게 적용하기 위한 스킬.

## Scope

- 순차 의존성이 있는 다단계 비동기 에러 처리
- `ky` `HTTPError` 상태 코드 분기
- `@suspensive/react` `ErrorBoundary` 통합

## Workflow

1. 호출 흐름을 분류한다: 순차 의존 / 독립 병렬 / 단일 호출.
2. 패턴 선택 가이드로 접근 방식을 결정한다.
3. 상세 예시를 적용하고 도메인 메시지만 치환한다.
4. 과도한 패턴 적용(`tryCatchAsync` 남용)을 점검한다.

## Pattern Selection

| 상황                             | 권장 패턴                       |
| -------------------------------- | ------------------------------- |
| 순차 의존성 있는 다단계 Mutation | `AsyncResult` + `tryCatchAsync` |
| 독립적인 여러 비동기 작업        | `Promise.allSettled`            |
| 단순 단일 API 호출               | 기존 `try-catch`                |
| 렌더링 중 에러 (쿼리 throw)      | `<ErrorBoundary>`               |
| HTTP 상태 코드별 분기            | `ky HTTPError` 타입 가드        |

## Reference

- [error-handling-patterns.md](references/error-handling-patterns.md) - 상세 패턴/코드 예시
