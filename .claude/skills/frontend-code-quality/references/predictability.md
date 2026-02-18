# Predictability — Detailed Examples

## A. Avoid Name Collisions

Don't shadow library names with custom wrappers. Different behavior behind the same name breaks expectations.

### Bad

```ts
// http.ts — wraps the library with same name
import { http as httpLibrary } from '@some-library/http'

export const http = {
  async get(url: string) {
    const token = await fetchToken()
    return httpLibrary.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}
```

```ts
// fetchUser.ts
import { http } from './http'

export async function fetchUser() {
  return http.get('...') // Looks like a plain GET, but silently fetches tokens
}
```

Problem: `http.get` looks identical to the library's `http.get`, but secretly adds auth headers. Developers expect standard HTTP behavior.

### Good

```ts
// httpService.ts
import { http as httpLibrary } from '@some-library/http'

export const httpService = {
  async getWithAuth(url: string) {
    const token = await fetchToken()
    return httpLibrary.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}
```

```ts
// fetchUser.ts
import { httpService } from './httpService'

export async function fetchUser() {
  return await httpService.getWithAuth('...')
  // Name makes auth behavior explicit
}
```

---

## B. Unify Return Types for Same-Kind Functions

Functions of the same kind (API hooks, validators) must return the same shape.

### Bad — Inconsistent API hooks

```ts
function useUser() {
  const query = useQuery({ queryKey: ['user'], queryFn: fetchUser })
  return query // Returns Query object
}

function useServerTime() {
  const query = useQuery({ queryKey: ['serverTime'], queryFn: fetchServerTime })
  return query.data // Returns raw data — different shape!
}
```

Problem: Developers must check return type of every API hook. Is it `Query`? Raw data? Easy to misuse.

### Good — Consistent API hooks

```ts
function useUser() {
  const query = useQuery({ queryKey: ['user'], queryFn: fetchUser })
  return query
}

function useServerTime() {
  const query = useQuery({ queryKey: ['serverTime'], queryFn: fetchServerTime })
  return query // Same shape as useUser
}
```

### Bad — Inconsistent validators

```ts
function checkIsNameValid(name: string) {
  return name.length > 0 && name.length < 20 // Returns boolean
}

function checkIsAgeValid(age: number) {
  if (!Number.isInteger(age)) {
    return { ok: false, reason: 'Age must be an integer.' } // Returns object
  }
  // ...
  return { ok: true }
}
```

Dangerous: `if (checkIsAgeValid(age))` is always truthy because it returns an object.

### Good — Consistent validators with Discriminated Union

```ts
type ValidationResult = { ok: true } | { ok: false; reason: string }

function checkIsNameValid(name: string): ValidationResult {
  if (name.length === 0) return { ok: false, reason: 'Name cannot be empty.' }
  if (name.length >= 20) return { ok: false, reason: 'Name must be under 20 chars.' }
  return { ok: true }
}

function checkIsAgeValid(age: number): ValidationResult {
  if (!Number.isInteger(age)) return { ok: false, reason: 'Age must be an integer.' }
  if (age < 18) return { ok: false, reason: 'Must be 18 or older.' }
  if (age > 99) return { ok: false, reason: 'Must be 99 or younger.' }
  return { ok: true }
}
```

Discriminated union enables type-safe access: `result.reason` only available when `result.ok === false`.

---

## C. Expose Hidden Logic

Don't embed side effects inside functions whose name/signature suggests purity.

### Bad

```ts
async function fetchBalance(): Promise<number> {
  const balance = await http.get<number>('...')
  logging.log('balance_fetched') // Hidden side effect!
  return balance
}
```

Problem: `fetchBalance` name and `Promise<number>` return type suggest a pure data fetch. Logging is invisible to callers — fires even when unwanted, and logging errors can break the fetch.

### Good

```ts
async function fetchBalance(): Promise<number> {
  const balance = await http.get<number>('...')
  return balance
}
```

```tsx
<Button
  onClick={async () => {
    const balance = await fetchBalance()
    logging.log('balance_fetched') // Logging is explicit at call site
    await syncBalance(balance)
  }}
>
  Refresh Balance
</Button>
```

Side effects are visible where they're triggered, not hidden inside utility functions.
