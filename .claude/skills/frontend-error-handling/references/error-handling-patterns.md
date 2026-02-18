# Frontend Error Handling Patterns

## 1. AsyncResult 패턴 - 순차 비동기 에러 처리

### Problem

순차 의존성이 있는 비동기 작업에서 단계별 에러 처리가 다르면 중첩 `try-catch`가 복잡도를 빠르게 올린다.

### Solution

`AsyncResult`와 `tryCatchAsync`를 통해 에러를 값으로 다뤄 선형 흐름을 만든다.

```tsx
type AsyncResult<T, E = Error> = Promise<
  | { ok: true; data: T }
  | { ok: false; error: E }
>

const tryCatchAsync = async <T>(
  fn: () => Promise<T>
): AsyncResult<T> => {
  try {
    const data = await fn()
    return { ok: true, data }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

const createOrderAndPay = async (orderData: OrderData) => {
  const orderResult = await tryCatchAsync(() =>
    createOrderMutation.mutateAsync(orderData)
  )
  if (!orderResult.ok) {
    showErrorDialog('주문 생성에 실패했습니다')
    return
  }

  const payResult = await tryCatchAsync(() =>
    confirmPaymentMutation.mutateAsync({ orderId: orderResult.data.id })
  )
  if (!payResult.ok) {
    showErrorDialog('결제 확인에 실패했습니다')
    return
  }

  const deliveryResult = await tryCatchAsync(() =>
    registerDeliveryMutation.mutateAsync({ orderId: orderResult.data.id })
  )
  if (!deliveryResult.ok) {
    showErrorDialog('배송 등록에 실패했습니다')
    return
  }

  router.navigate({ to: '/orders/complete' })
}
```

### Caveat

- 단일 호출에서 결국 다시 `throw`할 경우 일반 `try-catch`가 더 간결하다.
- 독립 호출은 순차 처리 대신 `Promise.allSettled`가 더 적합하다.

## 2. ky HTTPError 처리 패턴

### Problem

`ky`는 HTTP 실패 시 `HTTPError`를 throw하므로 상태 코드 기반 분기가 필요하다.

### Solution

```tsx
import { HTTPError } from 'ky'

const handleOrderError = async (error: unknown): Promise<string> => {
  if (error instanceof HTTPError) {
    const status = error.response.status
    if (status === 400) return '잘못된 주문 정보입니다'
    if (status === 409) return '이미 처리된 주문입니다'
    if (status === 422) {
      const body = await error.response.json<{ message: string }>()
      return body.message
    }
    return '서버 오류가 발생했습니다'
  }
  return '알 수 없는 오류가 발생했습니다'
}
```

## 3. ErrorBoundary 통합 패턴

### Problem

렌더링 단계 에러(`useSuspenseQuery` throw 포함)를 섹션 단위로 격리해야 한다.

### Solution

```tsx
import { ErrorBoundary, Suspense } from '@suspensive/react'

const OrderListPage = () => (
  <div>
    <ErrorBoundary
      fallback={({ error, reset }) => (
        <div>
          <p>주문 목록을 불러오지 못했습니다: {error.message}</p>
          <button onClick={reset}>다시 시도</button>
        </div>
      )}
    >
      <Suspense fallback={<OrderListSkeleton />}>
        <OrderListSection />
      </Suspense>
    </ErrorBoundary>

    <ErrorBoundary fallback={() => null}>
      <Suspense fallback={<RecommendationSkeleton />}>
        <RecommendationSection />
      </Suspense>
    </ErrorBoundary>
  </div>
)
```

## 4. 패턴 선택 가이드

| 상황                             | 권장 패턴                       |
| -------------------------------- | ------------------------------- |
| 순차 의존성 있는 다단계 Mutation | `AsyncResult` + `tryCatchAsync` |
| 독립적인 여러 비동기 작업        | `Promise.allSettled`            |
| 단순 단일 API 호출               | 기존 `try-catch`                |
| 렌더링 중 에러 (쿼리 throw)      | `<ErrorBoundary>`               |
| HTTP 상태 코드별 분기            | `ky HTTPError` 타입 가드        |
