---
name: typescript-patterns
description: Apply project TypeScript patterns for type-safe, IDE-friendly code.
  Use when designing component props with predefined values, modeling domain states
  with discriminated unions, inferring types from Zod schemas, or writing flexible
  string literal types. Covers PredefinedType pattern, tagged unions, and Zod inference.
---

# TypeScript Patterns

Project-specific TypeScript type design patterns for fullstack-forge.

## Pattern Selection

| Situation                                            | Pattern                          | Section |
| ---------------------------------------------------- | -------------------------------- | ------- |
| Props with recommended + custom values               | PredefinedType + Omit            | 1       |
| Mutually exclusive states (loading/error/success)    | Discriminated Union              | 2       |
| String props with IDE suggestions + flexibility      | `literal \| (string & {})`       | 3       |
| API contract types from schema                       | Zod `z.infer`                    | 4       |
| Enum-like constants with runtime value + type safety | `as const` object + derived type | 5       |

## 1. PredefinedType + Flexibility

IDE autocomplete for recommended values while allowing arbitrary values.

```tsx
type PredefinedGap = 0 | 4 | 8 | 12 | 16 | 20 | 24 | 32 | 40

interface StackLayoutProps {
  gap?: PredefinedGap | Omit<number, PredefinedGap>
}

// ✅ IDE suggests 0, 4, 8... first
// ✅ Custom values also accepted without type error
<StackLayout gap={16} />   // suggested
<StackLayout gap={164} />  // also valid
```

**When to use**: Predefined values have special treatment (e.g., Tailwind class mapping).
**When NOT to use**: All values handled identically — use plain `number`/`string` instead.

Conditions for correct usage:

- Predefined values map to optimized paths (Tailwind classes, design tokens)
- Predefined set is small (10-15 max)
- Predefined vs custom values have different runtime handling

See [references/patterns.md](references/patterns.md) for full implementation with Tailwind mapping.

## 2. Discriminated Union

Model mutually exclusive states where each variant carries only its relevant data.

### Basic: Result Type

```typescript
// ✅ Each state carries exactly the data it needs
type AsyncResult<T, E = Error> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: E }

const handleResult = (result: AsyncResult<User>) => {
  switch (result.status) {
    case 'idle':
    case 'loading':
      return null
    case 'success':
      return result.data.name // ✅ data narrowed, no optional chaining
    case 'error':
      return result.error.message // ✅ error narrowed
  }
}
```

### Domain State Modeling

```typescript
// ❌ Bag of optionals — every consumer must null-check everything
interface Order {
  status: string
  deliveryDriver?: string
  deliveredAt?: Date
  cancelReason?: string
  refundAmount?: number
}

// ✅ Discriminated union — impossible states are unrepresentable
type Order =
  | { status: 'pending'; items: OrderItem[] }
  | { status: 'confirmed'; items: OrderItem[]; confirmedAt: Date }
  | { status: 'delivering'; items: OrderItem[]; driver: string; estimatedAt: Date }
  | { status: 'delivered'; items: OrderItem[]; driver: string; deliveredAt: Date }
  | { status: 'cancelled'; items: OrderItem[]; reason: string; refundAmount: number }
```

### Exhaustiveness Check

```typescript
// Compiler catches missing cases when new variants are added
const assertNever = (x: never): never => {
  throw new Error(`Unexpected value: ${x}`)
}

const getOrderLabel = (order: Order): string => {
  switch (order.status) {
    case 'pending':
      return 'Waiting'
    case 'confirmed':
      return `Confirmed at ${order.confirmedAt}`
    case 'delivering':
      return `Driver: ${order.driver}`
    case 'delivered':
      return `Delivered at ${order.deliveredAt}`
    case 'cancelled':
      return `Cancelled: ${order.reason}`
    default:
      return assertNever(order) // ← compile error if a case is missing
  }
}
```

### Component Props with Discriminated Union

```tsx
// ❌ Boolean flags create impossible states
interface ButtonProps {
  loading?: boolean
  disabled?: boolean
  error?: string
}
// What does loading=true + disabled=true + error="fail" mean?

// ✅ Exactly one state at a time
type ButtonProps =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'disabled'; reason: string }
  | { state: 'error'; message: string }

const Button = (props: ButtonProps & { label: string }) => {
  switch (props.state) {
    case 'loading':
      return <button disabled>Loading...</button>
    case 'disabled':
      return (
        <button disabled title={props.reason}>
          {props.label}
        </button>
      )
    case 'error':
      return <button className="text-red-500">{props.message}</button>
    case 'idle':
      return <button>{props.label}</button>
  }
}
```

**When to use**:

- State has 3+ variants with different associated data
- Boolean flag combinations create impossible states
- `switch` exhaustiveness check adds safety

**When NOT to use**:

- Simple on/off toggle — `boolean` is fine
- Only 2 states with no differing data — `T | null` suffices

## 3. String Literal + Arbitrary

IDE suggests known values, custom strings accepted.

```tsx
type Theme = 'light' | 'dark' | (string & {})
type EventName = keyof WindowEventMap | (string & {})
```

## 4. Zod Schema Inference

Derive types from runtime schemas — single source of truth for validation and types.

```tsx
import { z } from 'zod'
import { OrderSchema } from '@fullstack-forge/api-spec'

type Order = z.infer<typeof OrderSchema>

const parseOrder = (data: unknown): Order => OrderSchema.parse(data)
```

## 5. Const Object + Derived Type (Enum Replacement)

Use `as const` objects instead of TypeScript `enum`. Provides runtime values, type safety, and tree-shakeability without enum drawbacks.

### Basic Pattern

```typescript
// ❌ enum — generates runtime object, not tree-shakeable, nominal typing issues
enum OrderStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Delivered = 'delivered',
}

// ✅ const object — plain object, values inlined at build time, structurally typed
const ORDER_STATUS = {
  Pending: 'pending',
  Confirmed: 'confirmed',
  Delivered: 'delivered',
} as const

type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]
// → 'pending' | 'confirmed' | 'delivered'
```

### Why Not Enum

|                   | `enum`                                                           | `as const` object                       |
| ----------------- | ---------------------------------------------------------------- | --------------------------------------- |
| Tree-shaking      | IIFE not eliminated                                              | Values inlined, object removed          |
| Structural typing | Nominal — `OrderStatus.Pending !== 'pending'`                    | Structural — `'pending'` works anywhere |
| Iteration         | `Object.values(OrderStatus)` includes reverse mappings (numeric) | `Object.values(ORDER_STATUS)` is clean  |
| Const assertion   | `const enum` has isolated modules issues                         | No such caveat                          |

### With Helper Utilities

```typescript
const ORDER_STATUS = {
  Pending: 'pending',
  Confirmed: 'confirmed',
  Delivering: 'delivering',
  Delivered: 'delivered',
  Cancelled: 'cancelled',
} as const

type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

// Runtime list for validation, dropdowns, iteration
const ORDER_STATUSES = Object.values(ORDER_STATUS)

// Type guard
const isOrderStatus = (value: string): value is OrderStatus =>
  ORDER_STATUSES.includes(value as OrderStatus)

// Label map — colocated with the const object
const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  [ORDER_STATUS.Pending]: 'Pending',
  [ORDER_STATUS.Confirmed]: 'Confirmed',
  [ORDER_STATUS.Delivering]: 'In Transit',
  [ORDER_STATUS.Delivered]: 'Delivered',
  [ORDER_STATUS.Cancelled]: 'Cancelled',
}
```

### With Discriminated Union

Const objects and discriminated unions compose naturally:

```typescript
const PAYMENT_METHOD = {
  Card: 'card',
  Bank: 'bank',
  Virtual: 'virtual',
} as const

type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD]

type Payment =
  | { method: typeof PAYMENT_METHOD.Card; cardLast4: string; approvedAt: Date }
  | { method: typeof PAYMENT_METHOD.Bank; accountNumber: string; transferredAt: Date }
  | { method: typeof PAYMENT_METHOD.Virtual; expiresAt: Date; depositor: string }
```

**When to use**: Any place you'd reach for `enum` — status codes, config keys, event names, permission levels.
**When NOT to use**: Only 2 values with no runtime usage — plain union type `'a' | 'b'` is simpler.

See [references/patterns.md](references/patterns.md) for more examples.

## Anti-Patterns

```typescript
// ❌ as any / @ts-ignore — never suppress type errors
const data = response as any

// ❌ Bag of optionals for mutually exclusive states
interface State { loading?: boolean; error?: Error; data?: T }

// ❌ PredefinedType without differentiated handling
const Comp = ({ size }: { size?: PredefinedSize | Omit<number, PredefinedSize> }) =>
  <div style={{ width: size }} />  // no special path for predefined values

// ❌ String enum when union type suffices
enum Status { Pending = 'pending', Active = 'active' }  // unnecessary runtime object
type Status = 'pending' | 'active'  // ✅ simpler, tree-shakeable
```
