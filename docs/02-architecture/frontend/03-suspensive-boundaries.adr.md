# ADR-0006: 비동기 상태 분기를 Suspensive 선언적 경계로 전환

- Status: Accepted
- Date: 2026-03-15
- Decision Makers: Frontend
- First Applied: `feat/cart` — CartPage

---

## STAR

### Situation — 기존 상태

페이지 컴포넌트가 `useQuery` 결과를 `isPending` / `isError` / 데이터 유무로 직접 분기하는 패턴이 반복되고 있었다.

```tsx
const query = useQuery(options())

return query.isPending ? (
  <Skeleton />
) : query.isError ? (
  <ErrorUI onRetry={() => query.refetch()} />
) : !query.data || query.data.items.length === 0 ? (
  <EmptyState />
) : (
  <Content data={query.data} />
)
```

이 패턴은 코드베이스 전체에서 반복되며, 다음과 같은 문제를 만들었다:

| 문제               | 설명                                                                            |
| ------------------ | ------------------------------------------------------------------------------- |
| **삼항 중첩**      | pending → error → empty → data 4단계 분기가 한 JSX 블록에 중첩                  |
| **관심사 혼재**    | 데이터 fetching 상태 관리와 mutation 로직이 동일 컴포넌트에 결합                |
| **에러 리셋 누락** | `query.refetch()` 호출만으로는 query의 에러 상태가 완전히 리셋되지 않을 수 있음 |
| **테스트 결합도**  | 상태별 렌더링 테스트가 query mock 설정에 전적으로 의존                          |
| **일관성 부재**    | 개발자마다 에러 UI, 로딩 UI 배치가 미묘하게 달라짐                              |

### Task — 해결해야 할 과제

1. 비동기 상태 분기(loading, error, data)를 선언적으로 표현하여 삼항 중첩을 제거한다.
2. 데이터 fetching 경계와 비즈니스 로직을 구조적으로 분리한다.
3. 에러 발생 시 query 상태까지 완전히 리셋하는 재시도 동작을 보장한다.
4. 이미 설치되어 있으나 미사용 중인 `@suspensive/react`, `@suspensive/react-query`를 실전 적용한다.

### Action — 선택한 접근

**`@suspensive/react`의 `<Suspense>`, `<ErrorBoundary>`와 `@suspensive/react-query`의 `<SuspenseQuery>`를 조합한 선언적 경계 패턴을 채택했다.**

```tsx
import { ErrorBoundary, Suspense } from '@suspensive/react'
import { SuspenseQuery } from '@suspensive/react-query'
import { QueryErrorResetBoundary } from '@tanstack/react-query'

function Page() {
  return (
    <main>
      <h1>제목</h1>
      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary
            onReset={reset}
            fallback={({ error, reset: resetBoundary }) => (
              <ErrorFallbackUI onRetry={resetBoundary} />
            )}
          >
            <Suspense fallback={<Skeleton />}>
              <SuspenseQuery {...queryOptions()}>
                {({ data }) =>
                  data.items.length === 0
                    ? <EmptyState />
                    : <ContentSection data={data} />
                }
              </SuspenseQuery>
            </Suspense>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </main>
  )
}

// Mutation 로직은 데이터 의존 컴포넌트에 격리
function ContentSection({ data }: Readonly<{ data: DataType }>) {
  const mutation = useMutation({ ... })
  return <div>...</div>
}
```

**핵심 구성 요소와 역할:**

| 구성 요소                 | 역할                                           | 왜 필요한가                                                |
| ------------------------- | ---------------------------------------------- | ---------------------------------------------------------- |
| `QueryErrorResetBoundary` | ErrorBoundary 리셋 시 query 에러 상태도 초기화 | `refetch()`만으로는 TanStack Query 내부 에러 플래그 미리셋 |
| `ErrorBoundary`           | query throw를 잡아 에러 UI 렌더링              | 렌더링 단계 에러를 선언적으로 격리                         |
| `Suspense`                | query pending 시 fallback 렌더링               | 로딩 상태를 컴포넌트 밖으로 끌어올림                       |
| `SuspenseQuery`           | query + render prop 코로케이션                 | 데이터 fetching 지점을 JSX에서 명시적으로 드러냄           |

**경계 배치 순서 (바깥 → 안쪽):**

```
QueryErrorResetBoundary  ← 에러 리셋 범위
  └─ ErrorBoundary       ← 에러 잡기
       └─ Suspense       ← 로딩 잡기
            └─ SuspenseQuery  ← 데이터 fetching + 렌더
```

### Result — 달성한 결과

#### 1. 코드 구조 개선

| 지표           | Before                               | After                            |
| -------------- | ------------------------------------ | -------------------------------- |
| 삼항 연산 깊이 | 4단계 중첩                           | 0 (선언적 경계로 대체)           |
| 컴포넌트 책임  | query + mutation + UI 혼재           | 셸(경계) / 컨텐츠(비즈니스) 분리 |
| 에러 리셋      | `refetch()` 수동 호출                | `QueryErrorResetBoundary` 자동   |
| 정적 UI 안정성 | 로딩/에러 시 제목까지 사라질 수 있음 | 경계 밖 배치로 항상 렌더         |

#### 2. 테스트 용이성 향상

| 테스트 시나리오 | Before                             | After                                   |
| --------------- | ---------------------------------- | --------------------------------------- |
| 로딩 상태       | query mock의 `isPending` 제어 필요 | MSW 응답 지연으로 자연스럽게 발생       |
| 에러 상태       | query mock의 `isError` 제어 필요   | MSW 에러 응답 → ErrorBoundary 자동 작동 |
| 데이터 상태     | query mock의 `data` 직접 설정      | MSW 정상 응답 → 실제 flow 테스트        |
| 재시도          | `refetch` 함수 호출 검증           | "다시 시도" 클릭 → 실제 리패치 검증     |

실제 cart 테스트에서:

- `<Suspense fallback>`: 520ms 지연 MSW 응답으로 skeleton 노출 확인
- `<ErrorBoundary fallback>`: 500 에러 MSW 응답으로 에러 UI + "다시 시도" 버튼 확인
- Mock 설정이 "query 상태를 어떻게 만들지"가 아닌 "서버가 어떻게 응답하는지"로 전환

#### 3. 개발 일관성

- 모든 데이터 fetching 페이지가 동일한 경계 구조를 따름
- 새 페이지 작성 시 보일러플레이트 패턴이 명확
- 에러/로딩 UI가 경계 수준에서 표준화

---

## Considered Alternatives

### A. React.Suspense + react-error-boundary

React 내장 `Suspense` + 커뮤니티 `react-error-boundary` 조합.

- 장점: 의존성이 적음
- 단점: `QueryErrorResetBoundary` 통합을 수동으로 구성해야 함, `resetKeys` 미지원, fallback 에러 시 무한 루프 위험
- 결론: **기각** — `@suspensive/react`가 이미 설치되어 있고, `shouldCatch`, `resetKeys`, fallback 에러 전파 등 추가 기능 제공

### B. useSuspenseQuery 훅 직접 사용

`@tanstack/react-query`의 `useSuspenseQuery`를 컴포넌트 내부에서 직접 호출.

- 장점: 익숙한 훅 패턴
- 단점: Suspense를 발생시키는 지점이 컴포넌트 이름만으로 예측 불가, prop-drilling 필요
- 결론: **보조적 사용** — Route Loader에서 prefetch 후 캐시 히트 용도로는 사용. 새 페이지의 주요 데이터 패턴은 `<SuspenseQuery>` 우선

### C. 현 상태 유지 (수동 isPending/isError 분기)

- 장점: 추가 학습 비용 없음
- 단점: 삼항 중첩, 에러 리셋 누락, 일관성 부재 지속
- 결론: **기각** — 코드베이스 규모가 커질수록 비용 증가

---

## 적용 범위와 마이그레이션 전략

### 신규 페이지

모든 데이터 fetching 페이지에 Suspensive 경계 패턴을 기본으로 적용한다.

### 기존 페이지

점진적으로 마이그레이션한다. 우선순위:

1. **높음**: query + mutation이 혼재된 복잡한 페이지 (cart, order)
2. **중간**: 단순 데이터 표시 페이지 (product-detail, product-list)
3. **낮음**: 이미 안정적으로 동작하는 간단한 페이지

### 적용하지 않는 경우

- Mutation 전용 컴포넌트 (폼 제출 등 — query 없이 mutation만 사용)
- 에러 시 비즈니스 로직이 필요한 경우 (redirect, 다른 API 호출 등)
- Dependent queries (A 결과로 B를 조건부 호출하는 경우)

---

## PRD Traceability

- Supports:
  - `docs/01-prd/04-cart/01-overview.md` — 장바구니 로딩/에러 UX 일관성
  - `docs/01-prd/00-overview.md` — 전체 사용자 경험 품질

## References

- Suspensive 공식 문서: <https://suspensive.org/ko/docs/react/Suspense>
- Suspensive ErrorBoundary: <https://suspensive.org/ko/docs/react/ErrorBoundary>
- SuspenseQuery: <https://suspensive.org/ko/docs/react-query/SuspenseQuery>
- 내부 스킬: `.claude/skills/suspensive-refactoring/SKILL.md`
- 내부 스킬: `.claude/skills/frontend-api-patterns/SKILL.md`
- 내부 스킬: `.claude/skills/frontend-error-handling/SKILL.md`
