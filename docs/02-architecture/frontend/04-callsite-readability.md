# 04. Call-site Readability — 제어흐름을 사용처에서 읽히게 만들기

> **요약**: mutation `on*` 콜백, `onXX` 핸들러명, 중간 변수는 제어흐름을 선언부에 숨긴다. 사용처(call site)에서 "무엇이 어떤 순서로 일어나는가"가 즉시 읽히도록 세 가지 규칙을 적용한다.
> **관련**: [02-api-patterns.md](./02-api-patterns.md), [frontend-api-patterns 스킬](../../../.claude/skills/frontend-api-patterns/SKILL.md), [frontend-code-quality 스킬](../../../.claude/skills/frontend-code-quality/SKILL.md)

---

## PAR

### Problem — 사용처에서 제어흐름이 보이지 않는다

장바구니 아이템 행(`CartItemRow`)에서 세 가지 패턴이 제어흐름을 숨기고 있었다.

#### 1. `on*` 콜백이 로직을 선언부에 묻는다

```tsx
const updateMutation = useMutation({
  ...updateCartItemMutationOptions(),
  onMutate: async ({ quantity: newQty }) => {
    await queryClient.cancelQueries({ queryKey: cartQueryKeys.cart })
    const previous = queryClient.getQueryData<CartResponse>(cartQueryKeys.cart)
    setOptimisticQty(newQty)
    if (previous) {
      queryClient.setQueryData<CartResponse>(cartQueryKeys.cart, { ... })
    }
    setError(null)
    return { previous }
  },
  onError: (err: Error, _vars, context) => {
    if (context?.previous) {
      queryClient.setQueryData(cartQueryKeys.cart, context.previous)
    }
    setOptimisticQty(null)
    setError(err.message)
  },
  onSettled: () => {
    setOptimisticQty(null)
    void queryClient.invalidateQueries({ queryKey: cartQueryKeys.cart })
  },
})

// 사용처: 이 한 줄만 봐서는 뒤에 무슨 일이 일어나는지 알 수 없다
updateMutation.mutate({ cartItemId: item.id, quantity: newQty })
```

| 문제                    | 설명                                                                                                                        |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **제어흐름 단절**       | `mutate()` 호출 후 optimistic update → rollback → invalidation이 어디서 일어나는지 call site에서 전혀 보이지 않는다         |
| **콜백 간 암묵적 의존** | `onMutate`가 반환한 `context`를 `onError`가 받아 쓰는 관계가 코드 구조로 드러나지 않고, TanStack Query 내부 규약에 의존한다 |
| **디버깅 비용**         | 버그 발생 시 `onMutate` → `onError` → `onSettled` 세 곳을 순회해야 흐름을 재구성할 수 있다                                  |

#### 2. `onXX` 핸들러명이 정보를 전달하지 않는다

```tsx
const onDelete = async () => { ... }
const onQuantityChange = async (newQty: number) => { ... }

// 사용처
<Button onClick={onDelete}>삭제</Button>
<Button onClick={() => onQuantityChange(displayQty - 1)}>−</Button>
```

정보이론 관점에서 `onDelete`는 정보량이 0이다:

| 구성 요소    | 이미 표현하는 것              | 함수명이 추가하는 것              |
| ------------ | ----------------------------- | --------------------------------- |
| `onClick=`   | **when** — 클릭 시점에 실행됨 | —                                 |
| `{onDelete}` | "on" → **when** (중복)        | "Delete" → **what** (유일한 정보) |

`onClick={onDelete}`를 읽으면 "클릭할 때(on) 삭제할 때(onDelete)" — "when"이 두 번 반복된다. 함수명에 남아야 할 것은 "그 시점에 **무엇**을 하느냐"뿐이다.

#### 3. 중간 변수가 출처를 끊는다

```tsx
const isMutating = deleteMutation.isPending

// ... 50줄 뒤 ...
<Button disabled={isMutating}>삭제</Button>       // isMutating이 뭔지 알려면 선언부까지 거슬러 올라가야 함
<Button disabled={isMutating || isOutOfStock}>−</Button>  // 어떤 mutation의 pending인지 즉시 알 수 없음
```

| 문제               | 설명                                                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **출처 단절**      | `isMutating`만 보면 어떤 mutation이 pending인지 알 수 없다. 선언부까지 시선이 이동해야 한다                            |
| **이름 충돌 위험** | mutation이 2개 이상이면 `isMutating`이 어떤 것을 가리키는지 모호해진다. `isDeleting`, `isUpdating` 등 alias가 증식한다 |

---

### Approach — 세 가지 규칙으로 call site에 제어흐름을 드러낸다

#### 규칙 1: `mutateAsync` + try/catch/finally로 전체 흐름을 call site에 기술한다

mutation 선언은 options만 전달하고, 모든 side-effect 로직은 사용처에서 순차적으로 읽히도록 한다.

```tsx
// mutation 선언 — options만
const updateMutation = useMutation(updateCartItemMutationOptions())

// call site — 제어흐름 전체가 위→아래로 읽힌다
const changeQuantity = async (newQty: number) => {
  if (newQty < 1 || newQty > 15) return
  setError(null)

  // 1. Optimistic update
  await queryClient.cancelQueries({ queryKey: cartQueryKeys.cart })
  const previous = queryClient.getQueryData<CartResponse>(cartQueryKeys.cart)
  setOptimisticQty(newQty)
  if (previous) {
    queryClient.setQueryData<CartResponse>(cartQueryKeys.cart, { ... })
  }

  // 2. Mutation
  try {
    await updateMutation.mutateAsync({ cartItemId: item.id, quantity: newQty })
  } catch (err) {
    // 3. Rollback on failure
    if (previous) {
      queryClient.setQueryData(cartQueryKeys.cart, previous)
    }
    setError(err instanceof Error ? err.message : '수량 변경에 실패했습니다')
  } finally {
    // 4. Always invalidate
    setOptimisticQty(null)
    void queryClient.invalidateQueries({ queryKey: cartQueryKeys.cart })
  }
}
```

**`on*` 콜백을 써야 하는 예외**: 동일 mutation이 3곳 이상에서 동일한 side-effect로 호출될 때. 중복 제거를 위해 `on*`에 공통 로직을 둔다.

#### 규칙 2: 핸들러 함수명은 action(what)만 담는다

```tsx
// ❌ "when" 중복
onClick={onDelete}        // "click할 때" + "delete할 때" → when이 2번
onClick={onQuantityChange}  // "click할 때" + "quantity change할 때"

// ✅ "what"만
onClick={removeItem}           // "click할 때" → "아이템을 제거한다"
onClick={() => changeQuantity(displayQty - 1)}  // "click할 때" → "수량을 변경한다"
```

| 접두사             | 문제                       | 대안                                            |
| ------------------ | -------------------------- | ----------------------------------------------- |
| `onDelete`         | "when" 중복, action 불명확 | `removeItem` — 무엇을 제거하는지 명시           |
| `onQuantityChange` | "when" 중복, 주체 불명     | `changeQuantity` — 동사 + 목적어                |
| `onSubmit`         | "when" 중복                | `submitOrder`, `saveProfile` 등 도메인 동작으로 |
| `handleClick`      | "when" 중복 + 너무 범용    | 구체적인 action 명으로                          |

#### 규칙 3: mutation 상태는 mutation 객체에서 직접 읽는다

```tsx
// ❌ 중간 변수
const isMutating = deleteMutation.isPending
<Button disabled={isMutating}>삭제</Button>

// ✅ 직접 참조 — 출처가 즉시 보임
<Button disabled={deleteMutation.isPending}>삭제</Button>
```

---

### Result — Before/After 전체 비교

#### Before

```tsx
export function CartItemRow({ item }: Readonly<{ item: CartItem }>) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [optimisticQty, setOptimisticQty] = useState<number | null>(null)

  // mutation 선언부에 로직이 흩어져 있다 (38줄)
  const updateMutation = useMutation({
    ...updateCartItemMutationOptions(),
    onMutate: async ({ quantity: newQty }) => {
      /* optimistic update 10줄 */
    },
    onError: (err, _vars, context) => {
      /* rollback 5줄 */
    },
    onSettled: () => {
      /* invalidation 3줄 */
    },
  })

  const deleteMutation = useMutation({
    ...deleteCartItemMutationOptions(),
    onMutate: async () => {
      /* optimistic update 12줄 */
    },
    onError: (_err, _vars, context) => {
      /* rollback + toast 4줄 */
    },
    onSettled: () => {
      /* invalidation 2줄 */
    },
  })

  // 중간 변수 — 출처가 끊김
  const isMutating = deleteMutation.isPending

  // 핸들러 — call site에서는 mutate() 한 줄만 보임
  const onQuantityChange = (newQty: number) => {
    if (newQty < 1 || newQty > 15) return
    setError(null)
    updateMutation.mutate({ cartItemId: item.id, quantity: newQty }) // 뒤에 뭐가 일어나지?
  }

  const onDelete = () => {
    deleteMutation.mutate(item.id) // 뒤에 뭐가 일어나지?
  }

  return (
    <div>
      <Button onClick={onDelete} disabled={isMutating}>
        삭제
      </Button>
      <Button onClick={() => onQuantityChange(displayQty - 1)} disabled={isMutating}>
        −
      </Button>
      <Button onClick={() => onQuantityChange(displayQty + 1)} disabled={isMutating}>
        +
      </Button>
    </div>
  )
}
```

**읽는 사람의 시선 경로**:

```
onClick={onDelete}
  → onDelete 함수 찾기 → deleteMutation.mutate(item.id)
    → deleteMutation 선언 찾기 → onMutate 읽기 → onError 읽기 → onSettled 읽기
      → 세 콜백의 실행 순서를 머릿속에서 재조립

disabled={isMutating}
  → isMutating 선언 찾기 → deleteMutation.isPending
```

최소 3단계 점프, 콜백 3개 순회가 필요하다.

#### After

```tsx
export function CartItemRow({ item }: Readonly<{ item: CartItem }>) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [optimisticQty, setOptimisticQty] = useState<number | null>(null)

  // mutation 선언 — options만 (2줄)
  const updateMutation = useMutation(updateCartItemMutationOptions())
  const deleteMutation = useMutation(deleteCartItemMutationOptions())

  // call site에 전체 흐름이 위→아래로 읽힌다
  const changeQuantity = async (newQty: number) => {
    if (newQty < 1 || newQty > 15) return
    setError(null)

    await queryClient.cancelQueries({ queryKey: cartQueryKeys.cart })
    const previous = queryClient.getQueryData<CartResponse>(cartQueryKeys.cart)
    setOptimisticQty(newQty)
    if (previous) { queryClient.setQueryData(...) }

    try {
      await updateMutation.mutateAsync({ cartItemId: item.id, quantity: newQty })
    } catch (err) {
      if (previous) queryClient.setQueryData(cartQueryKeys.cart, previous)
      setError(err instanceof Error ? err.message : '수량 변경에 실패했습니다')
    } finally {
      setOptimisticQty(null)
      void queryClient.invalidateQueries({ queryKey: cartQueryKeys.cart })
    }
  }

  const removeItem = async () => {
    await queryClient.cancelQueries({ queryKey: cartQueryKeys.cart })
    const previous = queryClient.getQueryData<CartResponse>(cartQueryKeys.cart)
    if (previous) { queryClient.setQueryData(...) }

    try {
      await deleteMutation.mutateAsync(item.id)
    } catch {
      if (previous) queryClient.setQueryData(cartQueryKeys.cart, previous)
      cartToast.error({ title: '삭제에 실패했습니다' })
    } finally {
      void queryClient.invalidateQueries({ queryKey: cartQueryKeys.cart })
    }
  }

  return (
    <div>
      <Button onClick={removeItem} disabled={deleteMutation.isPending}>삭제</Button>
      <Button onClick={() => changeQuantity(displayQty - 1)} disabled={deleteMutation.isPending}>−</Button>
      <Button onClick={() => changeQuantity(displayQty + 1)} disabled={deleteMutation.isPending}>+</Button>
    </div>
  )
}
```

**읽는 사람의 시선 경로**:

```
onClick={removeItem}
  → removeItem 함수: optimistic → try mutateAsync → catch rollback → finally invalidate
    → 끝. 한 곳에서 전체 흐름 파악 완료

disabled={deleteMutation.isPending}
  → 끝. 어떤 mutation의 pending인지 즉시 파악
```

점프 0회. 위에서 아래로 한 번만 읽으면 된다.

#### 효과 정리

| 지표                             | Before                                                     | After                                            |
| -------------------------------- | ---------------------------------------------------------- | ------------------------------------------------ |
| 제어흐름 파악에 필요한 시선 점프 | 3단계 (핸들러 → mutate → onMutate/onError/onSettled)       | 0단계 (함수 본문에 전부 기술)                    |
| mutation 선언부 크기             | 38줄 (update) + 31줄 (delete) = 69줄                       | 1줄 + 1줄 = 2줄                                  |
| 콜백 간 암묵적 의존 (`context`)  | `onMutate` → `onError`로 context 전달 (TanStack 내부 규약) | 로컬 변수 `previous`로 명시적 (언어 수준 스코프) |
| 핸들러명 정보량                  | `onDelete` — "when" 중복, action 불명확                    | `removeItem` — action만, 도메인 맥락 포함        |
| 상태 출처 추적                   | `isMutating` → 선언부 거슬러 올라감                        | `deleteMutation.isPending` → 즉시 파악           |
| 디버깅 시 순회 범위              | 콜백 3개 + 핸들러 1개 = 4곳                                | 함수 1개                                         |

---

## 세 가지 규칙 요약

| #   | 규칙                                           | 핵심 원리                                             | 예외                                                         |
| --- | ---------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------ |
| 1   | `mutateAsync` + try/catch/finally at call site | 제어흐름을 사용처에서 순차적으로 읽히게               | 동일 mutation이 3곳+ 동일 side-effect로 호출될 때 `on*` 허용 |
| 2   | 핸들러명은 action(what)만                      | `onClick`이 when을 이미 표현. 함수명에 when 중복 금지 | —                                                            |
| 3   | mutation 상태는 mutation 객체에서 직접 참조    | 중간 변수가 출처를 끊음                               | —                                                            |

## References

- 내부 스킬: `.claude/skills/frontend-api-patterns/SKILL.md` — Pattern 2 (Mutation Namespace), Pattern 9 (Mutation Imperative Flow)
- 내부 스킬: `.claude/skills/frontend-code-quality/SKILL.md` — Readability: "Name handlers by action, not event"
- 적용 사례: `apps/store/src/pages/cart/cart-page.sub/cart-item-row/cart-item-row.tsx`
