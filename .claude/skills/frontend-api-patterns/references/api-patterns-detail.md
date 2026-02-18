# API Patterns — Detailed Prerequisites & Examples

## Router Context Setup (Prerequisite for Pattern 0)

`loader` needs `queryClient` via router context.

### router.tsx

```tsx
import { queryClient } from '~/lib/query-client'

export function getRouter() {
  const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
    context: { queryClient },
  })
  return router
}
```

### \_\_root.tsx

```tsx
import { createRootRouteWithContext } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  // existing head, component config
})
```

## Pattern 0: Route Loader — Full Example

```tsx
// src/routes/orders/$orderId.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { orderDetailOptions, orderItemsOptions } from '~/queries/orders'

export const Route = createFileRoute('/orders/$orderId')({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(orderDetailOptions(params.orderId)),
      context.queryClient.ensureQueryData(orderItemsOptions(params.orderId)),
    ]),
  component: OrderDetailPage,
})

const OrderDetailPage = () => {
  const { orderId } = Route.useParams()
  const { data: order } = useSuspenseQuery(orderDetailOptions(orderId))
  const { data: items } = useSuspenseQuery(orderItemsOptions(orderId))

  return <OrderForm order={order} items={items} />
}
```

## Pattern 0-1: Server Function — Full Example

```tsx
// src/server-fns/orders.ts
import { createServerFn } from '@tanstack/react-start'
import type { Order } from '~/types'

export const fetchOrdersServer = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Order[]> => {
    const secret = process.env.INTERNAL_API_KEY
    const response = await fetch(`https://internal-api/orders`, {
      headers: { Authorization: `Bearer ${secret}` },
    })
    return response.json()
  },
)

// src/queries/orders.ts
import { queryOptions } from '@tanstack/react-query'
import { fetchOrdersServer } from '~/server-fns/orders'

export const ordersQueryOptions = () =>
  queryOptions({
    queryKey: ['orders'],
    queryFn: () => fetchOrdersServer(),
  })

// src/routes/orders/index.tsx
export const Route = createFileRoute('/orders/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(ordersQueryOptions()),
  component: OrdersPage,
})
```

## Pattern 1: SuspenseQuery Cohesion — Full Example

```tsx
import { SuspenseQueries } from '@suspensive/react-query'
import { ErrorBoundary, Suspense } from '@suspensive/react'

const selectActiveItems = (items: OrderItem[]) =>
  items
    .filter((i) => i.status === 'ACTIVE')
    .map((i) => ({
      ...i,
      displayPrice: `${i.price.toLocaleString()}won`,
    }))

const OrderDetailPage = ({ orderId }: { orderId: string }) => (
  <ErrorBoundary fallback={({ error }) => <p>{error.message}</p>}>
    <Suspense fallback={<OrderSkeleton />}>
      <SuspenseQueries
        queries={[
          orderDetailOptions(orderId),
          { ...orderItemsOptions(orderId), select: selectActiveItems },
        ]}
      >
        {([{ data: order }, { data: items }]) => <OrderForm order={order} items={items} />}
      </SuspenseQueries>
    </Suspense>
  </ErrorBoundary>
)
```

## Pattern 8: API Composition — Full Example

```tsx
import { queryOptions } from '@tanstack/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'
import { apiClient } from '~/lib/api-client'

const orderSummaryQueryFn = async (orderId: string) => {
  const [order, items, delivery] = await Promise.all([
    apiClient.get(`orders/${orderId}`).json<Order>(),
    apiClient.get(`orders/${orderId}/items`).json<OrderItem[]>(),
    apiClient.get(`orders/${orderId}/delivery`).json<DeliveryInfo>(),
  ])
  return { order, items, delivery }
}

export const orderSummaryOptions = (orderId: string) =>
  queryOptions({
    queryKey: ['order-summary', orderId],
    queryFn: () => orderSummaryQueryFn(orderId),
  })

const selectOrderSummaryView = (data: Awaited<ReturnType<typeof orderSummaryQueryFn>>) => ({
  orderNumber: data.order.number,
  totalPrice: data.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  deliveryStatus: data.delivery.status,
  estimatedArrival: data.delivery.estimatedAt,
})

const OrderSummaryCard = ({ orderId }: { orderId: string }) => {
  const { data } = useSuspenseQuery({
    ...orderSummaryOptions(orderId),
    select: selectOrderSummaryView,
  })

  return (
    <div>
      <p>Order: {data.orderNumber}</p>
      <p>Total: {data.totalPrice.toLocaleString()} won</p>
      <p>Delivery: {data.deliveryStatus}</p>
    </div>
  )
}
```
