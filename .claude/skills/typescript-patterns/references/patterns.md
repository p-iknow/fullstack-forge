# TypeScript Patterns — Full Examples

## PredefinedType + Tailwind Mapping

```tsx
type PredefinedGap = 0 | 4 | 8 | 12 | 16 | 20 | 24 | 32 | 40

interface StackLayoutProps {
  gap?: PredefinedGap | Omit<number, PredefinedGap>
  children: React.ReactNode
}

const GAP_CLASSES: Record<PredefinedGap, string> = {
  0: 'gap-0',
  4: 'gap-1',
  8: 'gap-2',
  12: 'gap-3',
  16: 'gap-4',
  20: 'gap-5',
  24: 'gap-6',
  32: 'gap-8',
  40: 'gap-10',
}

const StackLayout = ({ gap = 0, children }: StackLayoutProps) => {
  const isPredefined = (gap as number) in GAP_CLASSES

  return (
    <div
      className={cn('flex flex-col', isPredefined && GAP_CLASSES[gap as PredefinedGap])}
      style={isPredefined ? undefined : { gap: `${gap}px` }}
    >
      {children}
    </div>
  )
}
```

Benefits:

- Predefined values → Tailwind class (no runtime style overhead)
- Custom values → inline style fallback
- IDE autocomplete prioritizes predefined values

## Discriminated Union — Full Domain Example

### Order State Machine

```typescript
type OrderItem = { productId: string; quantity: number; price: number }

type Order =
  | { status: 'pending'; items: OrderItem[]; createdAt: Date }
  | { status: 'confirmed'; items: OrderItem[]; createdAt: Date; confirmedAt: Date }
  | { status: 'delivering'; items: OrderItem[]; createdAt: Date; driver: string; estimatedAt: Date }
  | { status: 'delivered'; items: OrderItem[]; createdAt: Date; driver: string; deliveredAt: Date }
  | {
      status: 'cancelled'
      items: OrderItem[]
      createdAt: Date
      reason: string
      refundAmount: number
    }

const assertNever = (x: never): never => {
  throw new Error(`Unexpected value: ${x}`)
}

const getStatusBadge = (order: Order) => {
  switch (order.status) {
    case 'pending':
      return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' }
    case 'confirmed':
      return { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' }
    case 'delivering':
      return { label: `Delivering (${order.driver})`, color: 'bg-indigo-100 text-indigo-800' }
    case 'delivered':
      return { label: 'Delivered', color: 'bg-green-100 text-green-800' }
    case 'cancelled':
      return { label: 'Cancelled', color: 'bg-red-100 text-red-800' }
    default:
      return assertNever(order)
  }
}
```

### API Response with Discriminated Union

```typescript
type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }

const fetchUser = async (id: string): Promise<ApiResponse<User>> => {
  const { data, error } = await getUser({ path: { id }, client, throwOnError: false })
  if (!data || error) {
    return { ok: false, error: { code: 'FETCH_FAILED', message: 'Failed to load user' } }
  }
  return { ok: true, data }
}

// Usage — compiler enforces checking ok before accessing data
const result = await fetchUser('123')
if (result.ok) {
  console.log(result.data.name) // ✅ narrowed to { ok: true; data: User }
} else {
  console.error(result.error.code) // ✅ narrowed to { ok: false; error: ... }
}
```

### Form State with Discriminated Union

```typescript
type FormState<T> =
  | { phase: 'editing'; values: Partial<T>; touched: Set<keyof T> }
  | { phase: 'validating'; values: T }
  | { phase: 'submitting'; values: T }
  | { phase: 'submitted'; values: T; response: SuccessResponse }
  | { phase: 'failed'; values: T; error: string }

// Each phase transition is explicit — no accidental state combinations
const reducer = (state: FormState<SignupInput>, action: FormAction): FormState<SignupInput> => {
  switch (action.type) {
    case 'SUBMIT':
      if (state.phase !== 'editing') return state
      return { phase: 'validating', values: action.values }
    case 'VALIDATION_PASSED':
      if (state.phase !== 'validating') return state
      return { phase: 'submitting', values: state.values }
    case 'SUCCESS':
      if (state.phase !== 'submitting') return state
      return { phase: 'submitted', values: state.values, response: action.response }
    case 'FAILURE':
      if (state.phase !== 'submitting') return state
      return { phase: 'failed', values: state.values, error: action.error }
  }
}
```

## Performance Notes

```tsx
// ✅ Mapping tables as module-level constants
const GAP_CLASSES: Record<PredefinedGap, string> = {
  /* ... */
}

const StackLayout = ({ gap }: StackLayoutProps) => {
  const isPredefined = (gap as number) in GAP_CLASSES
  // ...
}

// ❌ Recreated on every render
const StackLayout = ({ gap }: StackLayoutProps) => {
  const gapClasses = { 0: 'gap-0', 4: 'gap-1' } // new object each render
  // ...
}
```
