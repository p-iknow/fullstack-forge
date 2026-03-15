# 05. Optimistic Updates — 서버 응답 전에 UI를 먼저 반영하기

> **요약**: 장바구니 수량 변경, 삭제 같은 빈번한 mutation은 서버 응답을 기다리지 않고 UI를 즉시 갱신한다. TanStack Query 캐시 기반 optimistic update를 기본 패턴으로 채택하고, React 19 `useOptimistic` 훅은 제한된 시나리오에서만 사용한다.
> **관련**: [02-api-patterns.md](./02-api-patterns.md), [04-callsite-readability.md](./04-callsite-readability.md), [frontend-optimistic-updates 스킬](../../../.claude/skills/frontend-optimistic-updates/SKILL.md)

---

## PAR

### Problem — 서버 왕복 지연이 인터랙션을 방해한다

장바구니 수량 변경은 사용자가 가장 자주 수행하는 mutation이다.

| 방식 | 클릭 → 수량 표시 갱신 | 체감 |
| --- | --- | --- |
| 서버 응답 대기 | 200~500ms | 클릭 후 멈춤 → "고장났나?" |
| Optimistic update | ~0ms | 즉시 반영 → 자연스러움 |

문제는 optimistic update를 어떤 레이어에서, 어떤 메커니즘으로 구현할 것인가이다.

### Approach — TanStack Query 캐시 기반 Optimistic Update를 기본으로 채택

#### 후보 비교

| 접근 | 크로스 컴포넌트 동기화 | 롤백 | React 버전 | 상태 관리 레이어 |
| --- | --- | --- | --- | --- |
| **TQ Cache Imperative** | O (캐시 구독) | 수동 (snapshot) | 16.8+ | TanStack Query |
| TQ `onMutate` 콜백 | O | 자동 (context) | 16.8+ | TanStack Query |
| React `useOptimistic` | X (로컬만) | 자동 (transition) | 19+ | React state |
| Hybrid (useOptimistic + TQ) | O | 혼합 | 19+ | 이중 관리 |

#### 선택: TQ Cache Imperative (`mutateAsync` + `setQueryData`)

1. **단일 상태 레이어**: 서버 상태를 TanStack Query 캐시 한 곳에서 관리. Optimistic update도 같은 레이어.

2. **크로스 컴포넌트 동기화**: `queryClient.setQueryData()`로 캐시를 갱신하면 해당 쿼리를 구독하는 모든 컴포넌트가 즉시 리렌더. 장바구니 총액(store-top-nav), 아이템 수(cart-page), 개별 행(cart-item-row) 모두 자동 동기화.

3. **Call-site Readability**: [04-callsite-readability.md](./04-callsite-readability.md)의 규칙 1에 따라 `mutateAsync` + `try/catch/finally`로 전체 흐름이 사용처에서 읽힌다. `onMutate` 콜백은 제어흐름을 숨기므로 사용하지 않는다.

4. **명시적 롤백**: `catch`에서 `previous` 스냅샷을 복원. 어떤 상태로 돌아가는지 코드에서 바로 보인다.

#### useOptimistic을 기본으로 채택하지 않는 이유

| 문제 | 설명 |
| --- | --- |
| 로컬 상태 한정 | `useOptimistic`은 컴포넌트 내부 상태만 관리. 장바구니 총액을 표시하는 다른 컴포넌트는 여전히 서버 응답을 기다려야 함 |
| 이중 상태 관리 | Hybrid 패턴은 `useOptimistic` (로컬) + `setQueryData` (캐시) 두 곳에서 상태를 관리 → 디버깅 복잡도 증가 |
| Transition 강제 | `startTransition` 래핑 필수. 현재 `async/await` 기반 imperative flow에 이질적 |
| 설계 의도 불일치 | `useOptimistic`은 Server Actions + React Server Components 패러다임에 최적화. 이 프로젝트는 TanStack Start + TQ 패러다임 |

#### useOptimistic 허용 시나리오

다음 조건을 **모두** 만족할 때:

- 다른 컴포넌트가 해당 상태를 참조하지 않음
- 단순 토글/카운터 (boolean, 숫자 한 개)
- TanStack Query 캐시와 무관한 순수 UI 상태

**예시**: 리뷰 "도움이 됐어요" 토글, 알림 읽음 처리, Form submit 버튼 pending 표시.

### Result — 3단계 구조

모든 optimistic mutation은 동일한 3단계 구조를 따른다:

```
Step 1: cancelQueries + getQueryData (snapshot)
Step 2: setQueryData (optimistic cache update)
Step 3: try { mutateAsync } catch { rollback } finally { invalidateQueries }
```

#### 적용 사례: cart-item-row.tsx

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
        (sum, i) =>
          sum + i.unitPriceSnapshot * (i.id === item.id ? newQty : i.quantity),
        0,
      ),
      items: previous.items.map((i) =>
        i.id === item.id ? { ...i, quantity: newQty } : i,
      ),
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

#### 효과

| 지표 | 값 |
| --- | --- |
| 클릭 → UI 반영 | ~0ms (캐시 직접 갱신) |
| 롤백 시점 | catch 블록에서 즉시 (서버 에러 응답 직후) |
| 영향 컴포넌트 | 캐시 구독 전체 (총액, 아이템 수, 개별 행) |
| 최종 동기화 | finally에서 invalidateQueries → 서버 truth로 수렴 |

---

## 구현 체크리스트

- [ ] `cancelQueries` — 진행 중인 refetch가 optimistic 상태를 덮어쓰지 않도록
- [ ] `getQueryData` — 롤백용 스냅샷 저장
- [ ] `setQueryData` — 파생 값(총액, 개수)도 함께 계산
- [ ] `catch` — 롤백 + 사용자 에러 표시 (toast 또는 inline error)
- [ ] `finally` — `invalidateQueries`로 서버 데이터 재동기화 (`void` prefix)
- [ ] Validation — mutation 전 클라이언트 사이드 범위 체크

## References

- 패턴 스킬: [frontend-optimistic-updates](../../../.claude/skills/frontend-optimistic-updates/SKILL.md)
- API 패턴: [02-api-patterns.md](./02-api-patterns.md) — Pattern 9: Mutation Imperative Flow
- Call-site Readability: [04-callsite-readability.md](./04-callsite-readability.md)
- 적용 사례: `apps/store/src/pages/cart/cart-page.sub/cart-item-row/cart-item-row.tsx`
- React 공식 문서: [useOptimistic](https://react.dev/reference/react/useOptimistic)
