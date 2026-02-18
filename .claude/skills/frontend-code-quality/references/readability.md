# Readability — Detailed Examples

## A. Separate Non-Co-Executing Code

When a component handles multiple execution paths (e.g., viewer vs admin), split into separate components.

### Bad

```tsx
function SubmitButton() {
  const isViewer = useRole() === 'viewer'

  useEffect(() => {
    if (isViewer) {
      return
    }
    showButtonAnimation()
  }, [isViewer])

  return isViewer ? <TextButton disabled>Submit</TextButton> : <Button type="submit">Submit</Button>
}
```

Problem: Viewer and admin code paths interleave — reader must mentally track two branches simultaneously.

### Good

```tsx
function SubmitButton() {
  const isViewer = useRole() === 'viewer'
  return isViewer ? <ViewerSubmitButton /> : <AdminSubmitButton />
}

function ViewerSubmitButton() {
  return <TextButton disabled>Submit</TextButton>
}

function AdminSubmitButton() {
  useEffect(() => {
    showButtonAnimation()
  }, [])
  return <Button type="submit">Submit</Button>
}
```

Single branch point at top; each sub-component handles one path only.

---

## B. Abstract Implementation Details

Extract cross-cutting concerns so the main component's purpose is immediately clear.

### Bad

```tsx
function LoginStartPage() {
  useCheckLogin({
    onChecked: (status) => {
      if (status === 'LOGGED_IN') {
        location.href = '/home'
      }
    },
  })
  /* ... login logic ... */
  return <>{/* ... login UI ... */}</>
}
```

Problem: Auth check detail exposed inline — reader must parse `useCheckLogin`, `onChecked`, `status`, `"LOGGED_IN"` before understanding the page's real purpose.

### Good — Wrapper Component

```tsx
function App() {
  return (
    <AuthGuard>
      <LoginStartPage />
    </AuthGuard>
  )
}

function AuthGuard({ children }) {
  const status = useCheckLoginStatus()
  useEffect(() => {
    if (status === 'LOGGED_IN') {
      location.href = '/home'
    }
  }, [status])
  return status !== 'LOGGED_IN' ? children : null
}

function LoginStartPage() {
  /* ... login logic only ... */
  return <>{/* ... login UI ... */}</>
}
```

### Good — Extract child component

```tsx
export function FriendInvitation() {
  const { data } = useQuery(/* ... */)
  return (
    <>
      <InviteButton name={data.name} />
      {/* other UI */}
    </>
  )
}

function InviteButton({ name }) {
  return (
    <Button
      onClick={async () => {
        const canInvite = await overlay.openAsync(/* confirm dialog */)
        if (canInvite) await sendPush()
      }}
    >
      Invite
    </Button>
  )
}
```

Button logic and its handler live together; parent only sees `<InviteButton>`.

---

## C. Split Multi-Concern Functions

Don't create one hook per "page" that manages all query params. Split by concern.

### Bad

```ts
export function usePageState() {
  const [query, setQuery] = useQueryParams({
    cardId: NumberParam,
    statementId: NumberParam,
    dateFrom: DateParam,
    dateTo: DateParam,
    statusList: ArrayParam,
  })

  return useMemo(
    () => ({
      values: {
        cardId: query.cardId ?? undefined,
        dateFrom: query.dateFrom == null ? defaultDateFrom : moment(query.dateFrom),
        // ... all params
      },
      controls: {
        setCardId: (cardId: number) => setQuery({ cardId }, 'replaceIn'),
        // ... all setters
      },
    }),
    [query, setQuery],
  )
}
```

Problem: Unbounded responsibility. Any new query param gets added here. Any param change re-renders all consumers.

### Good

```ts
export function useCardIdQueryParam() {
  const [cardId, _setCardId] = useQueryParam('cardId', NumberParam)
  const setCardId = useCallback((cardId: number) => _setCardId({ cardId }, 'replaceIn'), [])
  return [cardId ?? undefined, setCardId] as const
}
```

One hook per query param — clear name, narrow responsibility, isolated re-renders.

---

## D. Name Complex Conditions

Extract complex boolean expressions into named variables.

### Bad

```ts
const result = products.filter((product) =>
  product.categories.some(
    (category) =>
      category.id === targetCategory.id &&
      product.prices.some((price) => price >= minPrice && price <= maxPrice),
  ),
)
```

### Good

```ts
const matchedProducts = products.filter((product) => {
  return product.categories.some((category) => {
    const isSameCategory = category.id === targetCategory.id
    const isPriceInRange = product.prices.some((price) => price >= minPrice && price <= maxPrice)
    return isSameCategory && isPriceInRange
  })
})
```

**When to name**: Complex logic, multiple conditions, reusable checks.
**When not to name**: Trivial expressions like `arr.map(x => x * 2)`.

---

## E. Name Magic Numbers

Replace unexplained numeric literals with named constants.

### Bad

```ts
async function onLikeClick() {
  await postLike(url)
  await delay(300)
  await refetchPostLike()
}
```

Why 300? Animation? Server lag? Leftover test code?

### Good

```ts
const ANIMATION_DELAY_MS = 300

async function onLikeClick() {
  await postLike(url)
  await delay(ANIMATION_DELAY_MS)
  await refetchPostLike()
}
```

---

## F. Reduce Eye-Travel

Avoid forcing the reader to jump between distant code sections to understand one behavior.

### Bad

```tsx
function Page() {
  const user = useUser()
  const policy = getPolicyByRole(user.role)
  return (
    <div>
      <Button disabled={!policy.canInvite}>Invite</Button>
      <Button disabled={!policy.canView}>View</Button>
    </div>
  )
}

function getPolicyByRole(role) {
  const policy = POLICY_SET[role]
  return { canInvite: policy.includes('invite'), canView: policy.includes('view') }
}

const POLICY_SET = { admin: ['invite', 'view'], viewer: ['view'] }
```

Problem: 3 eye-jumps to understand why Invite is disabled (`policy.canInvite` → `getPolicyByRole` → `POLICY_SET`).

### Good — Inline object

```tsx
function Page() {
  const user = useUser()
  const policy = {
    admin: { canInvite: true, canView: true },
    viewer: { canInvite: false, canView: true },
  }[user.role]

  return (
    <div>
      <Button disabled={!policy.canInvite}>Invite</Button>
      <Button disabled={!policy.canView}>View</Button>
    </div>
  )
}
```

### Good — Switch/case

```tsx
function Page() {
  const user = useUser()
  switch (user.role) {
    case 'admin':
      return (
        <div>
          <Button disabled={false}>Invite</Button>
          <Button disabled={false}>View</Button>
        </div>
      )
    case 'viewer':
      return (
        <div>
          <Button disabled={true}>Invite</Button>
          <Button disabled={false}>View</Button>
        </div>
      )
    default:
      return null
  }
}
```

---

## G. Simplify Ternaries

Replace nested ternaries with explicit control flow.

### Bad

```ts
const status = A && B ? 'BOTH' : A || B ? (A ? 'A' : 'B') : 'NONE'
```

### Good

```ts
const status = (() => {
  if (A && B) return 'BOTH'
  if (A) return 'A'
  if (B) return 'B'
  return 'NONE'
})()
```

---

## H. Order Comparisons Naturally

Write range checks left-to-right like math: `min <= x && x <= max`.

### Bad

```ts
if (a >= b && a <= c) { ... }
if (score >= 80 && score <= 100) { ... }
```

### Good

```ts
if (b <= a && a <= c) { ... }
if (80 <= score && score <= 100) { ... }
```

Reads like `80 <= score <= 100` — matches mathematical notation.
