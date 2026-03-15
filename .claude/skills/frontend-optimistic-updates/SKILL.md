---
name: frontend-optimistic-updates
description: Apply optimistic UI update patterns for mutations that require immediate user feedback. Use when implementing cart operations, like/unlike toggles, quantity changes, or any mutation where the UI should reflect changes before server confirmation. Covers TanStack Query cache-based optimistic updates, React 19 useOptimistic hook, and hybrid patterns with decision criteria.
---

# Frontend Optimistic Updates

4 optimistic update patterns: 2 TanStack Query cache-based + 1 React 19 `useOptimistic` + 1 hybrid.

## Decision Guide: Which Pattern?

```
Does the mutation affect data visible in OTHER components?
  YES → Does the project use TanStack Query?
    YES → Pattern 1 (TQ Cache Imperative) or Pattern 2 (TQ Cache Derived)
    NO  → Pattern 4 (Hybrid)
  NO  → Is it a simple toggle/counter (boolean or single value)?
    YES → Pattern 3 (useOptimistic Simple)
    NO  → Pattern 1 (TQ Cache Imperative)
```

## Pattern Selection

| #   | Pattern                    | Use When                                                                          |
| --- | -------------------------- | --------------------------------------------------------------------------------- |
| 1   | TQ Cache Imperative        | **DEFAULT.** Mutation affects shared query cache; cross-component sync needed     |
| 2   | TQ Cache Derived State     | Optimistic value derived from cache (e.g., total price from items)                |
| 3   | useOptimistic Simple       | Component-local optimistic state; no cross-component sync; React 19+             |
| 4   | Hybrid (useOptimistic + TQ)| Local display + cache sync both needed; Server Actions or form-based mutations    |

## Pattern 1: TQ Cache Imperative — `mutateAsync` + `setQueryData`

**DEFAULT for this project.** Follows [call-site readability](../../../docs/02-architecture/frontend/04-callsite-readability.md) — all optimistic logic visible at call site.

```tsx
const updateMutation = useMutation(updateCartItemMutationOptions())

const changeQuantity = async (newQty: number) => {
  if (newQty < 1 || newQty > 15) return
  setError(null)

  // 1. Cancel + snapshot
  await queryClient.cancelQueries({ queryKey: cartQueryKeys.cart })
  const previous = queryClient.getQueryData<CartResponse>(cartQueryKeys.cart)

  // 2. Optimistic cache update (other components see this immediately)
  setOptimisticQty(newQty)
  if (previous) {
    queryClient.setQueryData<CartResponse>(cartQueryKeys.cart, {
      ...previous,
      totalAmount: previous.items.reduce(
        (sum, i) => sum + i.unitPriceSnapshot * (i.id === item.id ? newQty : i.quantity),
        0,
      ),
      items: previous.items.map((i) =>
        i.id === item.id ? { ...i, quantity: newQty } : i,
      ),
    })
  }

  // 3. Mutation + rollback
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

**3-step structure**: cancel+snapshot → cache update → try/catch/finally.

## Pattern 2: TQ Cache Derived State

When optimistic values are **derived** from cache data (totals, counts, filtered lists).

```tsx
const removeItem = async () => {
  await queryClient.cancelQueries({ queryKey: cartQueryKeys.cart })
  const previous = queryClient.getQueryData<CartResponse>(cartQueryKeys.cart)

  // Derived values (itemCount, totalAmount) computed from items
  if (previous) {
    const filtered = previous.items.filter((i) => i.id !== item.id)
    queryClient.setQueryData<CartResponse>(cartQueryKeys.cart, {
      ...previous,
      itemCount: filtered.length,
      totalAmount: filtered.reduce(
        (sum, i) => sum + i.unitPriceSnapshot * i.quantity, 0,
      ),
      items: filtered,
    })
  }

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

## Pattern 3: useOptimistic Simple — React 19

Component-local optimistic state. No query cache involvement. Auto-reverts when transition ends.

```tsx
import { useOptimistic, startTransition } from 'react'

function LikeButton({ isLiked, onToggle }: { isLiked: boolean; onToggle: () => Promise<void> }) {
  const [optimisticLiked, setOptimisticLiked] = useOptimistic(isLiked)

  const toggleLike = () => {
    startTransition(async () => {
      setOptimisticLiked(!optimisticLiked)
      await onToggle()
    })
  }

  return (
    <button onClick={toggleLike}>
      {optimisticLiked ? '❤️' : '🤍'}
    </button>
  )
}
```

**Requirements**: React 19+, `startTransition` wrapper (or Action prop).

**Reducer variant** — for complex state with multiple action types:

```tsx
const [optimisticCart, dispatch] = useOptimistic(
  cart,
  (current, action: { type: 'add' | 'remove' | 'update_qty'; payload: unknown }) => {
    switch (action.type) {
      case 'update_qty':
        return current.map((item) =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.qty, pending: true }
            : item,
        )
      case 'remove':
        return current.filter((item) => item.id !== action.payload.id)
      default:
        return current
    }
  },
)
```

## Pattern 4: Hybrid — useOptimistic + TQ Cache

Use `useOptimistic` for local display speed + `queryClient.setQueryData()` for cross-component sync. Best for Server Actions or when both local responsiveness and cache consistency matter.

```tsx
function CartItemRow({ item }: Readonly<{ item: CartItem }>) {
  const queryClient = useQueryClient()
  const [optimisticQty, setOptimisticQty] = useOptimistic(item.quantity)
  const updateMutation = useMutation(updateCartItemMutationOptions())

  const changeQuantity = (newQty: number) => {
    if (newQty < 1 || newQty > 15) return

    startTransition(async () => {
      // Local: immediate visual feedback
      setOptimisticQty(newQty)

      // Cache: cross-component sync
      await queryClient.cancelQueries({ queryKey: cartQueryKeys.cart })
      const previous = queryClient.getQueryData<CartResponse>(cartQueryKeys.cart)
      if (previous) {
        queryClient.setQueryData<CartResponse>(cartQueryKeys.cart, {
          ...previous,
          items: previous.items.map((i) =>
            i.id === item.id ? { ...i, quantity: newQty } : i,
          ),
        })
      }

      try {
        await updateMutation.mutateAsync({ cartItemId: item.id, quantity: newQty })
      } catch {
        if (previous) queryClient.setQueryData(cartQueryKeys.cart, previous)
      } finally {
        void queryClient.invalidateQueries({ queryKey: cartQueryKeys.cart })
      }
    })
  }

  return <span>{optimisticQty}</span>
}
```

## Caveats

- `useOptimistic` setter **must** be called inside `startTransition` or an Action prop. Outside = warning + brief flash.
- `useOptimistic` state is component-local. Other components reading query cache won't see it.
- Rapid clicks with `useOptimistic` can cause [duplication bugs](https://github.com/facebook/react/issues/28574) — guard with `isPending` or debounce.
- Pattern 1 is the **project default** per [call-site readability](../../../docs/02-architecture/frontend/04-callsite-readability.md) and [API patterns](../../../docs/02-architecture/frontend/02-api-patterns.md).
- `on*` callbacks (`onMutate`/`onError`/`onSettled`) hide control flow. Use imperative `try/catch/finally` except when same mutation is called 3+ places with identical side-effects.
- Always `cancelQueries` before `setQueryData` to prevent race conditions.
- Always `invalidateQueries` in `finally` to ensure server-truth reconciliation.

## Reference

- [Detailed patterns, decision criteria, and useOptimistic deep dive](references/optimistic-patterns-detail.md)
