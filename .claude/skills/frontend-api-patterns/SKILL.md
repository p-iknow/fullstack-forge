---
name: frontend-api-patterns
description: Apply consistent data fetching patterns using TanStack Query v5, @suspensive/react-query, and TanStack Start Route Loader. Use when implementing API calls, route-level prefetching, suspense queries, mutations, or parallel data loading in frontend apps.
---

# Frontend API Patterns

11 data fetching patterns: 2 route-level (Loader, Server Function) + 9 component-level (TanStack Query + Suspensive).

## Pattern Selection

| #   | Pattern                   | Use When                                                                    |
| --- | ------------------------- | --------------------------------------------------------------------------- |
| 0   | Route Loader              | Page requires data before render; prevent waterfall                         |
| 0-1 | Server Function           | Loader needs server-only logic (env vars, DB)                               |
| 1   | SuspenseQuery Cohesion    | Query declaration and usage far apart; need co-location                     |
| 2   | Mutation Namespace        | Multiple mutations cause destructuring alias confusion                      |
| 3   | Mutation Cohesion         | Mutation declaration and usage far apart                                    |
| 4   | Mutation Conditional      | Need conditional/loop mutation without violating Hooks rules                |
| 5   | SuspenseQuery Conditional | Need conditional data fetching without wrapper components                   |
| 6   | Parallel Queries          | Multiple independent queries waterfall via nested `<Suspense>`              |
| 7   | PrefetchQuery             | Pre-load data before user interaction (tab click, navigation)               |
| 8   | API Composition           | Multiple APIs need combining into single query interface                    |
| 9   | Mutation Imperative Flow  | **DEFAULT.** Single-use mutation; control flow must be visible at call site |

## Route-Level Patterns

### Pattern 0: Route Loader

Prefetch in `loader` with `ensureQueryData`. Component consumes cache via `useSuspenseQuery`.

**Prerequisite**: Router context must include `queryClient`. See [references/api-patterns-detail.md](references/api-patterns-detail.md).

```tsx
export const Route = createFileRoute('/orders/$orderId')({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(orderDetailOptions(params.orderId)),
      context.queryClient.ensureQueryData(orderItemsOptions(params.orderId)),
    ]),
  component: OrderDetailPage,
})
```

| Method            | Rendering    | Error Handling                    | Use For        |
| ----------------- | ------------ | --------------------------------- | -------------- |
| `ensureQueryData` | Blocking     | Throws to route error boundary    | Essential data |
| `prefetchQuery`   | Non-blocking | Errors ignored, component handles | Optional data  |

| Hook         | Timing                   | Purpose                         |
| ------------ | ------------------------ | ------------------------------- |
| `beforeLoad` | Pre-loading (sequential) | Auth checks, redirects, context |
| `loader`     | Loading (parallel)       | Data fetching/prefetching       |

### Pattern 0-1: Server Function

`createServerFn` for server-only logic. Runs directly on server; becomes HTTP RPC on client.

```tsx
export const fetchOrdersServer = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Order[]> => {
    const secret = process.env.INTERNAL_API_KEY
    return fetch(`https://internal-api/orders`, {
      headers: { Authorization: `Bearer ${secret}` },
    }).then((r) => r.json())
  },
)
```

> `createServerFn` is `@tanstack/react-start` only. This project has a separate Hono backend — most calls use `ky`. Use `createServerFn` only for server-only logic.

## Component-Level Patterns

### Pattern 1: SuspenseQuery Cohesion — `<SuspenseQueries>`

Co-locate fetch + transform + render. Use `select` for data transformation.

```tsx
<SuspenseQueries
  queries={[
    orderDetailOptions(orderId),
    { ...orderItemsOptions(orderId), select: selectActiveItems },
  ]}
>
  {([{ data: order }, { data: items }]) => <OrderForm order={order} items={items} />}
</SuspenseQueries>
```

### Pattern 2: Mutation Namespace

Keep mutation objects as namespaced variables, not destructured. 사용처에서도 중간 변수로 꺼내지 말고 `mutation.isPending` 등 mutation 객체를 직접 참조한다.

```tsx
const confirmMutation = useMutation(confirmOrderOptions(orderId))
const payMutation = useMutation(payOrderOptions(orderId))
// confirmMutation.isPending, payMutation.mutateAsync()
```

```tsx
// ❌ 중간 변수 — 출처가 끊김
const isMutating = deleteMutation.isPending
// ... 50줄 뒤 ...
<Button disabled={isMutating}>  // isMutating이 뭔지 선언부까지 거슬러 올라가야 함

// ✅ mutation 객체 직접 참조 — 출처가 즉시 보임
<Button disabled={deleteMutation.isPending}>
```

### Patterns 3–4: Mutation Cohesion & Conditional — `<Mutation>`

Render-prop for co-location. Works in conditionals/loops (unlike hooks).

```tsx
<Mutation {...submitOrderOptions(orderId)}>
  {(mutation) => (
    <button disabled={mutation.isPending} onClick={() => mutation.mutateAsync()}>
      {mutation.isPending ? 'Processing...' : 'Submit'}
    </button>
  )}
</Mutation>
```

### Pattern 5: SuspenseQuery Conditional — `<SuspenseQuery>`

```tsx
{
  isAdmin && (
    <SuspenseQuery queryOptions={adminDataOptions(orderId)}>
      {({ data }) => <AdminPanel data={data} />}
    </SuspenseQuery>
  )
}
```

### Pattern 6: Parallel Queries — Waterfall Prevention

Single `<SuspenseQueries>` instead of nested `<Suspense>` boundaries.

```tsx
// ❌ Nested <Suspense> causes sequential fetching (waterfall)
// ✅ Single <SuspenseQueries> fetches all in parallel
<Suspense fallback={<Skeleton />}>
  <SuspenseQueries queries={[queryA, queryB, queryC]}>
    {([{ data: a }, { data: b }, { data: c }]) => <Layout a={a} b={b} c={c} />}
  </SuspenseQueries>
</Suspense>
```

### Pattern 7: PrefetchQuery

Pre-load data before user clicks. Wraps the trigger element.

```tsx
<PrefetchQuery {...reviewListOptions(orderId)}>
  <button onClick={openReviewTab}>View Reviews</button>
</PrefetchQuery>
```

### Pattern 8: API Composition Layer

Combine multiple APIs into single `queryFn` with `Promise.all`. Use `select` for view model.

```tsx
const orderSummaryQueryFn = async (orderId: string) => {
  const [order, items, delivery] = await Promise.all([
    apiClient.get(`orders/${orderId}`).json<Order>(),
    apiClient.get(`orders/${orderId}/items`).json<OrderItem[]>(),
    apiClient.get(`orders/${orderId}/delivery`).json<DeliveryInfo>(),
  ])
  return { order, items, delivery }
}
```

### Pattern 9: Mutation Imperative Flow — `mutateAsync` + try/catch/finally

**DEFAULT mutation pattern.** Side-effect 로직을 call site에 기술하여 제어흐름을 명시적으로 만든다.

**Why**: `on*` 콜백(`onSuccess`, `onError`, `onSettled`)은 제어흐름을 mutation 선언부에 흩뿌린다. Call site에서는 `mutation.mutate(...)` 한 줄만 보이므로 "이 호출 이후 무엇이 일어나는가"를 알 수 없다. `mutateAsync`를 쓰면 전체 흐름이 위→아래로 읽힌다.

```tsx
// ✅ DEFAULT — call site에 제어흐름이 모두 보임
const updateMutation = useMutation(updateItemOptions())

const onQuantityChange = async (newQty: number) => {
  // 1. Optimistic update
  await queryClient.cancelQueries({ queryKey: cartQueryKeys.cart })
  const previous = queryClient.getQueryData<Response>(queryKey)
  queryClient.setQueryData<Response>(queryKey, optimisticNext)

  // 2. Mutation
  try {
    await updateMutation.mutateAsync({ itemId, quantity: newQty })
  } catch (err) {
    // 3. Rollback on failure
    if (previous) queryClient.setQueryData(queryKey, previous)
    setError(err instanceof Error ? err.message : 'Failed')
  } finally {
    // 4. Always invalidate
    void queryClient.invalidateQueries({ queryKey })
  }
}
```

```tsx
// ❌ on* callbacks — call site에서 제어흐름이 보이지 않음
const updateMutation = useMutation({
  ...updateItemOptions(),
  onMutate: async () => {
    /* optimistic */
  },
  onError: (err, vars, ctx) => {
    /* rollback + error */
  },
  onSettled: () => {
    /* invalidate */
  },
})

// 이 한 줄만 봐서는 뒤에 무슨 일이 일어나는지 알 수 없다
updateMutation.mutate({ itemId, quantity: newQty })
```

**`on*` 콜백을 써야 하는 경우**: 동일 mutation이 3곳 이상에서 동일한 side-effect 로직으로 호출될 때. 중복 제거를 위해 `on*`에 공통 로직을 둔다.

## Caveats

- `loader` is isomorphic (server + client). Never put secrets in loader directly.
- `ensureQueryData` errors bubble to **route** error boundary, not component `<ErrorBoundary>`.
- Loader-prefetched data hits `useSuspenseQuery` cache — no `<Suspense>` fallback shown.
- Don't nest `<SuspenseQueries>`. Single `queries` array for independent queries.
- Avoid 15+ simultaneous API calls — separate essential vs optional data.
- Dependent queries (A result needed for B) must use staged nesting.
- `wrap` pattern (Suspensive v2) is deprecated. Use `<ErrorBoundary>/<Suspense>` directly.
- If individual API caching matters more than combined, use `<SuspenseQueries>` over Composition.

## Reference

- [Detailed prerequisites and examples](references/api-patterns-detail.md)
