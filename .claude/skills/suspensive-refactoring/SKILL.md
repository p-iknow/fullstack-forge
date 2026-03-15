---
name: suspensive-refactoring
description: Refactor manual useQuery isPending/isError state checks into declarative Suspensive boundaries. Use when migrating pages from manual loading/error ternaries to @suspensive/react Suspense and ErrorBoundary with @suspensive/react-query SuspenseQuery, or when reviewing components that still use manual query state branching.
---

# Suspensive Refactoring

수동 `useQuery` + `isPending`/`isError` 분기를 Suspensive 선언적 경계(`<Suspense>`, `<ErrorBoundary>`, `<SuspenseQuery>`)로 전환하는 리팩토링 가이드.

## Scope

- `useQuery` + 수동 `isPending`/`isError` 삼항 연산자 → Suspensive 선언적 경계
- `QueryErrorResetBoundary` 통합으로 에러 재시도 동작 보장
- 데이터 의존 로직을 별도 컴포넌트로 추출하는 패턴

## Smell Detection

리팩토링 대상을 식별하는 코드 냄새:

```tsx
// ❌ 이 패턴이 보이면 리팩토링 대상
const query = useQuery(someOptions())

return (
  <>
    {query.isPending ? (
      <Skeleton />
    ) : query.isError ? (
      <ErrorUI />
    ) : !query.data ? (
      <EmptyState />
    ) : (
      <Content data={query.data} />
    )}
  </>
)
```

**리팩토링하지 않는 경우:**

- Mutation 전용 컴포넌트 (쿼리 없이 mutation만 사용)
- 에러 시 특별한 비즈니스 로직이 필요한 경우 (redirect, 다른 API 호출 등)
- 쿼리 결과에 따라 다른 쿼리를 조건부 호출하는 경우 (dependent queries)

## Workflow

1. **Smell 감지**: `useQuery` + `isPending`/`isError` 삼항 패턴 확인
2. **구조 분석**: 컴포넌트 내 mutation 유무, 데이터 의존 범위 파악
3. **경계 구성**: `ErrorBoundary` → `Suspense` → `SuspenseQuery` 순서로 래핑
4. **컨텐츠 추출**: 데이터 의존 로직을 별도 컴포넌트로 분리
5. **검증**: LSP 진단 + 기존 테스트 통과 확인

## Transformation Steps

### Step 1: Import 교체

```diff
- import { useQuery, useQueryClient } from '@tanstack/react-query'
+ import { useMutation, QueryErrorResetBoundary, useQueryClient } from '@tanstack/react-query'
+ import { ErrorBoundary, Suspense } from '@suspensive/react'
+ import { SuspenseQuery } from '@suspensive/react-query'
```

### Step 2: 경계 구조 작성

```tsx
<QueryErrorResetBoundary>
  {({ reset }) => (
    <ErrorBoundary
      onReset={reset}
      fallback={({ error, reset: resetBoundary }) => <ErrorFallbackUI onRetry={resetBoundary} />}
    >
      <Suspense fallback={<Skeleton />}>
        <SuspenseQuery {...queryOptions()}>{({ data }) => <Content data={data} />}</SuspenseQuery>
      </Suspense>
    </ErrorBoundary>
  )}
</QueryErrorResetBoundary>
```

### Step 3: 데이터 의존 로직 추출

Mutation이나 복잡한 UI 로직이 있으면 별도 컴포넌트로 추출:

```tsx
// Before: 하나의 컴포넌트에 query + mutation + UI 전부
// After: 페이지 셸 / 데이터 컨텐츠 분리

function Page() {
  return (
    <main>
      <h1>제목</h1>
      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary onReset={reset} fallback={...}>
            <Suspense fallback={<Skeleton />}>
              <SuspenseQuery {...queryOptions()}>
                {({ data }) => <ContentSection data={data} />}
              </SuspenseQuery>
            </Suspense>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </main>
  )
}

// Mutation 로직은 이 컴포넌트에 격리
function ContentSection({ data }: Readonly<{ data: DataType }>) {
  const queryClient = useQueryClient()
  const mutation = useMutation({ ... })
  return <div>...</div>
}
```

## Key Rules

- `QueryErrorResetBoundary`는 항상 `ErrorBoundary` 바깥에 위치 — 에러 재시도 시 쿼리 에러 상태도 리셋
- `ErrorBoundary` → `Suspense` 순서 — 에러가 Suspense보다 먼저 잡혀야 함
- `SuspenseQuery` children은 render prop — `{({ data }) => ...}` 형태
- 정적 UI(제목, 네비게이션)는 경계 밖에 배치 — 로딩/에러 시에도 보임
- `Readonly<>` 타입 래퍼로 추출된 컴포넌트 props 보호

## Reference

- [refactoring-example.md](references/refactoring-example.md) — 실제 cart-page 리팩토링 전/후 전체 코드
