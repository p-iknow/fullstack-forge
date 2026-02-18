---
name: frontend-testing
description: Apply frontend testing conventions and testable function design principles. Use when writing tests, enforcing given-when-then structure, designing testable functions, choosing test scope, or applying vitest conventions including factory patterns and parameterized tests.
---

# Frontend Testing

Apply the repository test convention and testable function design principles.

## Comment Structure

Every `test(...)` block must have these markers in order:

- `// given` — setup inputs and preconditions
- `// when` — execute the function under test
- `// then` — assert expected outcomes

### Rules

- Exact lowercase markers: `// given`, `// when`, `// then`.
- Do not rename (`// setup`, `// act`, `// assert` not used here).
- One blank line between sections where practical.
- If a section is naturally empty, keep the marker with a blank line below.

## Test Conventions

### File Naming

```
src/utils/format-price.ts → src/utils/format-price.test.ts
```

Use `.test.ts`, not `.spec.ts`.

### Describe and Test

```tsx
describe(functionName.name, () => {
  test('specific situation produces expected result', () => {
    // given
    // when
    // then
  })
})
```

- `describe`: Use `functionName.name` (auto-reflects renames).
- `test`: Use `test`, not `it`.
- Test description: Korean or English, describing situation and expected outcome.

### Parameterized Tests

```tsx
describe(formatPrice.name, () => {
  test.each([
    { input: 0, expected: '0won' },
    { input: 1000, expected: '1,000won' },
    { input: 10000, expected: '10,000won' },
  ])('formats $input to "$expected"', ({ input, expected }) => {
    // given
    const price = input

    // when
    const result = formatPrice(price)

    // then
    expect(result).toBe(expected)
  })
})
```

### Time-Dependent Tests

```tsx
describe('isOrderExpired', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  test('expires after 30 minutes', () => {
    // given
    vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'))
    const order = createOrder({ createdAt: '2024-01-15T09:29:00.000Z' })

    // when
    const result = isOrderExpired(order)

    // then
    expect(result).toBe(true)
  })
})
```

## Testable Function Design

### Principle 1: Inject Time Dependencies

Never call `new Date()` inside the function. Accept time as a parameter.

```tsx
// ❌ Untestable — result changes every execution
const format = (order: Order) => ({ createdAt: new Date().toISOString() })

// ✅ Testable — deterministic with injected time
const format = (order: Order, now: Date) => ({ createdAt: now.toISOString() })
```

### Principle 2: Separate API Calls from Business Logic

Extract pure business logic into standalone functions. Unit test only the pure function.

```tsx
// ✅ Pure function — unit testable
const calculateOrderPrice = (items: OrderItem[], discountRate: number) => {
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  return { total, discounted: total * (1 - discountRate) }
}

// API orchestration stays separate (integration test territory)
const processOrder = async (id: string) => {
  const order = await fetchOrder(id)
  return { ...order, ...calculateOrderPrice(order.items, order.discountRate) }
}
```

### Principle 3: Test Select Functions

TanStack Query `select` functions are pure — perfect unit test targets.

```tsx
const selectActiveOrders = (orders: Order[]) =>
  orders
    .filter((o) => o.status === 'ACTIVE')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
```

### Principle 4: Factory Pattern for Test Data

Use factory functions for repeated test data. Test boundary values (0, null, empty, max).

```tsx
const createOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 'order-test-1',
  status: 'ACTIVE',
  amount: 10000,
  items: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
})

test('zero amount gets zero discount', () => {
  // given
  const order = createOrder({ amount: 0 })

  // when
  const result = calculateDiscount(order)

  // then
  expect(result.discountAmount).toBe(0)
})
```

## Test Scope Guide

| Target                   | Method                    | Tool                   |
| ------------------------ | ------------------------- | ---------------------- |
| Pure business logic      | Unit test                 | vitest                 |
| Select functions         | Unit test                 | vitest                 |
| Time-dependent functions | `vi.useFakeTimers()`      | vitest                 |
| API call logic           | Integration test (MSW)    | vitest + msw           |
| Component rendering      | Component test            | @testing-library/react |
| DOM-dependent logic      | Component test (not unit) | @testing-library/react |

> DOM-dependent logic does NOT belong in unit tests. Separate it into component tests.

## Workflow

1. Find target test files (`*.test.ts`).
2. Ensure every `test(...)` block has `// given`, `// when`, `// then` in order.
3. Apply testable function design when writing new test targets.
4. Use factory functions for test data creation.
5. Keep behavior unchanged when restructuring existing tests.
6. Run tests: `pnpm test` (whole repo) or scoped run.

## Quick Check

Before finishing, verify:

- Every `test(...)` block has all three markers in correct order.
- New functions follow testable design principles (injected dependencies, pure logic).
- Factory functions used for repeated test data.
- Tests pass (`pnpm test`).
