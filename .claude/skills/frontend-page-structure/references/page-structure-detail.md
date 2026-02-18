# Page Structure — Detailed Examples

## Full Directory Example: Single View Page

```
src/screens/
└── orders/
    ├── @shared/
    │   ├── ui/
    │   │   └── order-common-header.tsx
    │   └── helper/
    │       ├── useOrderCalculator.ts
    │       └── orderFormatter.ts
    └── checkout/
        ├── @shared/
        │   └── helper/
        │       └── useCheckoutFlow.ts
        └── intro/
            ├── checkout-intro-page.tsx
            ├── checkout-intro-page.event.ts
            └── checkout-intro-page.sub/
                ├── header/
                │   ├── header.tsx
                │   ├── header.helper/
                │   │   ├── calculateProgress.ts
                │   │   └── calculateProgress.test.ts
                │   └── header.ui/
                │       ├── title.tsx
                │       └── subtitle.tsx
                ├── content/
                │   ├── content.tsx
                │   └── content.ui/
                │       └── content-card.tsx
                └── submit-button/
                    └── submit-button.tsx
```

## Full Directory Example: Multi-View Page

```
checkout/result/$id/
├── result-detail-page.tsx
├── result-detail-page.event.ts
└── result-detail-page.views/
    ├── summary-view/
    │   ├── summary-view.tsx
    │   └── summary-view.sub/
    │       ├── overview/
    │       │   ├── overview.tsx
    │       │   └── overview.ui.tsx
    │       └── metrics/
    │           ├── metrics.tsx
    │           ├── metrics.helper.ts
    │           └── metrics.ui.tsx
    └── detail-view/
        ├── detail-view.tsx
        └── detail-view.sub/
            ├── order-info/
            │   ├── order-info.tsx
            │   └── order-info.ui.tsx
            └── delivery-schedule/
                ├── delivery-schedule.tsx
                └── delivery-schedule.ui.tsx
```

## Sub Component Progressive Complexity

### Simple (single file)

```
header/
├── header.tsx
├── header.helper.ts      # 1 helper → file
└── header.ui.tsx          # 1 UI → file
```

### Complex (folder)

```
header/
├── header.tsx
├── header.helper/         # 2+ helpers → folder
│   ├── calculateProgress.ts
│   └── formatData.ts
└── header.ui/             # 2+ UIs → folder
    ├── progress-bar.tsx
    └── title.tsx
```

### Deeply Complex (nested helper)

```
payment-form/
├── payment-form.tsx
└── payment-form.helper/
    ├── format.ts
    ├── validate.ts
    ├── calculate.ts              # Public API
    └── calculate.helper.ts       # Internal implementation
```

## @shared Sharing: Sub and View Examples

```
orders/
├── @shared/
│   ├── ui/
│   │   └── order-badge.tsx
│   ├── sub/                          # Complex shared sub-component
│   │   └── order-summary/
│   │       ├── order-summary.tsx
│   │       ├── order-summary.helper.ts
│   │       └── order-summary.ui/
│   │           ├── summary-card.tsx
│   │           └── summary-chart.tsx
│   └── views/                        # Shared view (rare)
│       └── error-view/
│           ├── error-view.tsx
│           └── error-view.ui.tsx
├── checkout/
│   └── intro/
│       └── intro-page.sub/
│           └── content/
│               └── content.tsx       # Uses @shared/sub/order-summary
└── history/
    └── detail/
        └── detail-page.sub/
            └── overview/
                └── overview.tsx      # Uses @shared/sub/order-summary
```

## Data Fetching Layer Location

```tsx
// src/queries/orders.ts — Shared query options (central)
export const orderQueryOptions = {
  list: () => queryOptions({ queryKey: ['orders'], queryFn: fetchOrders }),
  detail: (id: string) => queryOptions({ queryKey: ['orders', id], queryFn: () => fetchOrder(id) }),
}

// screens/.../checkout-intro-page.helper.ts — Screen-local logic
export const calculateCheckoutProgress = (order: Order) => {
  // Calculation only needed by this screen
  return percentage
}
```

## Event File Convention

```tsx
// checkout-intro-page.event.ts
export const CHECKOUT_INTRO_PAGE_VIEW = 'checkout_intro_page_view'
export const CHECKOUT_INTRO_HEADER_BACK_CLICK = 'checkout_intro_header_back_click'
export const CHECKOUT_INTRO_CONTENT_STEP_CLICK = 'checkout_intro_content_step_click'
export const CHECKOUT_INTRO_NEXT_BUTTON_CLICK = 'checkout_intro_next_button_click'
```

Trade-off: Sub components import from parent's event file (slight cohesion loss for centralized event tracking).

## Constants in Helpers

Use purpose-revealing names, not generic `constants.ts`:

```tsx
// ❌ header.constants.ts
// ✅ header.helper.ts — constants included with logic
export const MAX_TITLE_LENGTH = 50
export const PROGRESS_ANIMATION_MS = 300
export const ORDER_STATUS_LABELS = {
  pending: 'Payment Pending',
  confirmed: 'Order Confirmed',
  delivered: 'Delivered',
} as const
```
