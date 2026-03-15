# Optimistic Update Patterns — 상세 가이드

> **요약**: 프론트엔드에서 mutation 결과를 서버 응답 전에 UI에 즉시 반영하는 패턴을 정리한다. TanStack Query 캐시 기반 접근과 React 19 `useOptimistic` 훅을 비교하고, 이 프로젝트에서의 선택 근거를 설명한다.

---

## 1. 왜 Optimistic Update가 필요한가

사용자가 수량 변경 버튼을 클릭하면:

| 방식                   | 체감 응답 시간 | 사용자 경험                     |
| ---------------------- | -------------- | ------------------------------- |
| 서버 응답 대기 후 반영 | 200~500ms+     | 버튼 클릭 후 지연 → 불안감      |
| Optimistic update      | ~0ms           | 즉시 반영 → 자연스러운 인터랙션 |

특히 장바구니 수량 변경, 좋아요 토글, 삭제 같은 **빈번하고 예측 가능한 mutation**에서 효과가 크다.

---

## 2. 두 가지 접근: TanStack Query Cache vs React useOptimistic

### 2.1 TanStack Query Cache 기반 (Pattern 1, 2)

```
User Action → cancelQueries → snapshot → setQueryData (optimistic) → mutateAsync
  ├── success → invalidateQueries (서버 데이터로 갱신)
  └── failure → setQueryData(previous) (롤백) → invalidateQueries
```

**특징**:

- 쿼리 캐시를 직접 조작하므로 **모든 구독 컴포넌트가 즉시 업데이트**
- 장바구니 총액, 헤더 아이템 수 등 파생 데이터도 함께 갱신
- 롤백이 명시적: `previous` 스냅샷을 `catch`에서 복원
- React 버전 무관 (16.8+)

### 2.2 React 19 useOptimistic (Pattern 3)

```
User Action → startTransition(async () => {
  setOptimistic(newValue)  ← 즉시 렌더링
  await serverMutation()
})
← transition 종료 시 자동으로 value로 복귀
```

**특징**:

- **컴포넌트 로컬 상태**만 관리 — 다른 컴포넌트는 모름
- `startTransition` 내부에서만 호출 가능
- 실패 시 자동 롤백 (value가 변경되지 않았으므로)
- React 19+ 필수
- Server Actions / Form Actions와 자연스럽게 통합

### 2.3 비교 매트릭스

| 기준                   | TQ Cache (Pattern 1)               | useOptimistic (Pattern 3) |
| ---------------------- | ---------------------------------- | ------------------------- |
| 크로스 컴포넌트 동기화 | **O** — 캐시 구독으로 자동         | **X** — 로컬 상태만       |
| 롤백 메커니즘          | 수동 (`previous` 스냅샷)           | 자동 (transition 종료 시) |
| 에러 표시              | `catch`에서 직접 처리              | `catch`에서 직접 처리     |
| TypeScript 지원        | 강력 (캐시 타입 추론)              | 기본 (제네릭)             |
| React 버전             | 16.8+                              | 19+                       |
| TanStack Query 통합    | 네이티브                           | 별도 관리 필요            |
| 코드량                 | 많음 (cancel + snapshot + restore) | 적음 (한 줄 선언)         |
| Concurrent 기능        | X                                  | O (Transition 우선순위)   |

---

## 3. 프로젝트 아키텍처 결정

### 3.1 기본 패턴: TQ Cache Imperative (Pattern 1)

**선택 근거**:

1. **TanStack Query가 상태 관리 레이어**: 이 프로젝트는 서버 상태를 TQ 캐시로 관리한다. Optimistic update도 같은 레이어에서 처리해야 일관성 유지.

2. **크로스 컴포넌트 동기화 필수**: 장바구니 총액(`store-top-nav`), 아이템 수(`cart-page`), 개별 행(`cart-item-row`) 모두 같은 캐시를 구독. `useOptimistic`으로는 이 동기화 불가.

3. **Call-site readability 원칙 준수**: [04-callsite-readability.md](../../../docs/02-architecture/frontend/04-callsite-readability.md) — 모든 side-effect가 call site에서 위→아래로 읽혀야 함.

4. **`on*` 콜백 대신 `try/catch/finally`**: [frontend-api-patterns Pattern 9](../SKILL.md) — 제어흐름이 mutation 선언부에 흩어지지 않도록.

### 3.2 useOptimistic 적합 시나리오

다음 조건을 **모두** 만족할 때 Pattern 3을 고려:

- [ ] 다른 컴포넌트가 해당 상태를 참조하지 않음
- [ ] 단순 토글/카운터 (boolean, 숫자 한 개)
- [ ] Server Actions 또는 Form Actions 사용
- [ ] TanStack Query 캐시와 무관한 순수 UI 상태

**예시**: 상품 리뷰 "도움이 됐어요" 토글, 알림 읽음 처리, Form submit 버튼 pending 표시.

### 3.3 cart-item-row.tsx 분석

현재 코드의 수량 변경 패턴:

```tsx
const [optimisticQty, setOptimisticQty] = useState<number | null>(null)
const displayQty = optimisticQty ?? item.quantity

// 1. 로컬 optimistic 상태 (setOptimisticQty)
// 2. 캐시 optimistic 상태 (queryClient.setQueryData)
// 3. 수동 롤백 (catch + setQueryData(previous))
// 4. 정리 (finally: setOptimisticQty(null) + invalidateQueries)
```

**`useOptimistic`으로 대체 가능한 부분**: `useState<number | null>` → `useOptimistic(item.quantity)`

**대체 불가능한 부분**: `queryClient.setQueryData()` — 장바구니 총액, 다른 컴포넌트 동기화

**결론**: 부분 대체는 가능하나 **하이브리드 패턴(Pattern 4)**이 되어 복잡도가 증가. 현재 Pattern 1이 프로젝트 규칙에 더 부합.

---

## 4. 패턴별 상세 구현

### 4.1 Pattern 1: TQ Cache Imperative — 3단계 구조

모든 optimistic mutation은 동일한 3단계 구조를 따른다:

```
Step 1: Cancel + Snapshot
Step 2: Optimistic Cache Update
Step 3: try { mutateAsync } catch { rollback } finally { invalidate }
```

#### 수량 변경 (update)

```tsx
const changeQuantity = async (newQty: number) => {
  if (newQty < 1 || newQty > 15) return
  setError(null)

  // Step 1: Cancel + Snapshot
  await queryClient.cancelQueries({ queryKey: cartQueryKeys.cart })
  const previous = queryClient.getQueryData<CartResponse>(cartQueryKeys.cart)

  // Step 2: Optimistic Cache Update
  setOptimisticQty(newQty)
  if (previous) {
    queryClient.setQueryData<CartResponse>(cartQueryKeys.cart, {
      ...previous,
      totalAmount: previous.items.reduce(
        (sum, i) => sum + i.unitPriceSnapshot * (i.id === item.id ? newQty : i.quantity),
        0,
      ),
      items: previous.items.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i)),
    })
  }

  // Step 3: Mutation + Rollback + Invalidation
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
```

#### 삭제 (delete)

```tsx
const removeItem = async () => {
  // Step 1
  await queryClient.cancelQueries({ queryKey: cartQueryKeys.cart })
  const previous = queryClient.getQueryData<CartResponse>(cartQueryKeys.cart)

  // Step 2 — 파생 값(itemCount, totalAmount)을 함께 계산
  if (previous) {
    const filtered = previous.items.filter((i) => i.id !== item.id)
    queryClient.setQueryData<CartResponse>(cartQueryKeys.cart, {
      ...previous,
      itemCount: filtered.length,
      totalAmount: filtered.reduce((sum, i) => sum + i.unitPriceSnapshot * i.quantity, 0),
      items: filtered,
    })
  }

  // Step 3
  try {
    await deleteMutation.mutateAsync(item.id)
  } catch {
    if (previous) queryClient.setQueryData(cartQueryKeys.cart, previous)
    cartToast.error({ title: '삭제에 실패했습니다' })
  } finally {
    void queryClient.invalidateQueries({ queryKey: cartQueryKeys.cart })
  }
}
```

### 4.2 Pattern 3: useOptimistic 상세

#### 단순 토글

```tsx
import { useOptimistic, startTransition } from 'react'

function LikeButton({
  isLiked,
  onToggle,
}: {
  isLiked: boolean
  onToggle: (newValue: boolean) => Promise<void>
}) {
  const [optimisticLiked, setOptimisticLiked] = useOptimistic(isLiked)

  const toggleLike = () => {
    startTransition(async () => {
      setOptimisticLiked(!optimisticLiked)
      await onToggle(!optimisticLiked)
      // transition 끝 → isLiked prop이 변경되지 않았으면 원래 값으로 복귀
      // isLiked prop이 변경되었으면 새 값으로 렌더링
    })
  }

  return (
    <button onClick={toggleLike} aria-pressed={optimisticLiked}>
      {optimisticLiked ? '❤️ 좋아요 취소' : '🤍 좋아요'}
    </button>
  )
}
```

#### Reducer 패턴 — 복합 상태

```tsx
type CartAction =
  | { type: 'update_qty'; id: string; qty: number }
  | { type: 'remove'; id: string }
  | { type: 'add'; item: CartItem }

function CartList({
  items,
  cartActions,
}: {
  items: CartItem[]
  cartActions: {
    update: (id: string, qty: number) => Promise<void>
    remove: (id: string) => Promise<void>
  }
}) {
  const [optimisticItems, dispatch] = useOptimistic(
    items,
    (current: CartItem[], action: CartAction) => {
      switch (action.type) {
        case 'update_qty':
          return current.map((item) =>
            item.id === action.id ? { ...item, quantity: action.qty, pending: true } : item,
          )
        case 'remove':
          return current.filter((item) => item.id !== action.id)
        case 'add':
          return [...current, { ...action.item, pending: true }]
      }
    },
  )

  const changeQuantity = (id: string, qty: number) => {
    startTransition(async () => {
      dispatch({ type: 'update_qty', id, qty })
      await cartActions.update(id, qty)
    })
  }

  return (
    <ul>
      {optimisticItems.map((item) => (
        <li key={item.id} style={{ opacity: item.pending ? 0.6 : 1 }}>
          {item.name} x {item.quantity}
          {item.pending && ' (저장 중...)'}
        </li>
      ))}
    </ul>
  )
}
```

### 4.3 Pattern 4: Hybrid 상세

```tsx
function CartItemRow({ item }: Readonly<{ item: CartItem }>) {
  const queryClient = useQueryClient()
  // useOptimistic: 로컬 수량 즉시 반영
  const [optimisticQty, setOptimisticQty] = useOptimistic(item.quantity)
  const updateMutation = useMutation(updateCartItemMutationOptions())

  const changeQuantity = (newQty: number) => {
    if (newQty < 1 || newQty > 15) return

    startTransition(async () => {
      // 1. 로컬 즉시 반영
      setOptimisticQty(newQty)

      // 2. 캐시 동기화 (다른 컴포넌트용)
      await queryClient.cancelQueries({ queryKey: cartQueryKeys.cart })
      const previous = queryClient.getQueryData<CartResponse>(cartQueryKeys.cart)
      if (previous) {
        queryClient.setQueryData<CartResponse>(cartQueryKeys.cart, {
          ...previous,
          totalAmount: previous.items.reduce(
            (sum, i) => sum + i.unitPriceSnapshot * (i.id === item.id ? newQty : i.quantity),
            0,
          ),
          items: previous.items.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i)),
        })
      }

      // 3. Mutation
      try {
        await updateMutation.mutateAsync({ cartItemId: item.id, quantity: newQty })
      } catch {
        if (previous) queryClient.setQueryData(cartQueryKeys.cart, previous)
      } finally {
        void queryClient.invalidateQueries({ queryKey: cartQueryKeys.cart })
      }
    })
  }

  return <span className="tabular-nums">{optimisticQty}</span>
}
```

**하이브리드의 장점**: `useOptimistic`이 `useState` + 수동 정리를 대체하여 코드가 약간 짧아짐.
**하이브리드의 단점**: 이중 상태 관리 — 디버깅 시 "이 값이 optimistic에서 온 건가, 캐시에서 온 건가?" 혼란 가능.

---

## 5. useOptimistic 주의사항

### 5.1 반드시 startTransition 내부에서 호출

```tsx
// ❌ Warning: "An optimistic state update occurred outside a Transition or Action"
function handleClick() {
  setOptimistic(newValue) // 경고 + 즉시 복귀
}

// ✅
function handleClick() {
  startTransition(async () => {
    setOptimistic(newValue)
    await mutation()
  })
}

// ✅ Action prop 내부 — startTransition 불필요
async function submitAction(formData: FormData) {
  setOptimistic(newValue) // Action prop이므로 이미 transition 내부
  await serverAction(formData)
}
```

### 5.2 연속 클릭 시 중복 문제

[React Issue #28574](https://github.com/facebook/react/issues/28574): 빠른 연속 클릭 시 optimistic 상태가 중복 표시될 수 있음.

**대응**: `isPending` 체크 또는 `disabled` 속성으로 중복 클릭 방지.

```tsx
const [isPending, startTransition] = useTransition()

<button disabled={isPending} onClick={handleClick}>
  {isPending ? '처리 중...' : '확인'}
</button>
```

### 5.3 Updater vs Reducer 선택

| 상황                      | 패턴                                     | 이유                          |
| ------------------------- | ---------------------------------------- | ----------------------------- |
| 단순 값 교체 (토글, 숫자) | `setOptimistic(newValue)`                | 간단                          |
| 기존 값 기반 계산         | `setOptimistic(prev => prev + 1)`        | 동시 mutation 시 최신 값 기반 |
| 복합 상태 (여러 필드)     | `useOptimistic(state, reducer)`          | 일관된 업데이트 보장          |
| 여러 action 타입          | `useOptimistic(state, reducer)` + switch | 타입별 분기                   |

---

## 6. 체크리스트

### Optimistic Update 구현 시

- [ ] `cancelQueries` — 진행 중인 refetch가 optimistic 상태를 덮어쓰지 않도록
- [ ] `getQueryData` — 롤백용 스냅샷 저장
- [ ] `setQueryData` — 파생 값(총액, 개수)도 함께 계산
- [ ] `catch` — 롤백 + 사용자 에러 표시
- [ ] `finally` — `invalidateQueries`로 서버 데이터 재동기화
- [ ] Validation — mutation 전 클라이언트 사이드 검증 (범위 체크 등)

### useOptimistic 사용 시

- [ ] React 19+ 확인
- [ ] `startTransition` 래핑 (Action prop이 아닌 경우)
- [ ] 연속 클릭 방지 (disabled 또는 isPending)
- [ ] 다른 컴포넌트의 캐시 동기화가 불필요한지 확인
