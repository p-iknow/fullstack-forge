# Zod v3 → v4 Migration Map

## String Format Validators

All string format validators moved to top-level `z` namespace. The old chained forms
(`z.string().xxx()`) still work but are deprecated and will be removed in a future version.

### Basic replacements

```typescript
// ❌ Deprecated                    // ✅ Modern
z.string().uuid()                   z.uuid()
z.string().email()                  z.email()
z.string().url()                    z.url()
z.string().emoji()                  z.emoji()
z.string().base64()                 z.base64()
z.string().nanoid()                 z.nanoid()
z.string().cuid()                   z.cuid()
z.string().cuid2()                  z.cuid2()
z.string().ulid()                   z.ulid()
```

### ISO date/time replacements

```typescript
// ❌ Deprecated                    // ✅ Modern
z.string().datetime()               z.iso.datetime()
z.string().date()                   z.iso.date()
z.string().time()                   z.iso.time()
```

Note: There is no direct v3 equivalent for `z.iso.duration()` — it is new in v4.

### IP address replacements

```typescript
// ❌ Deprecated                    // ✅ Modern
z.string().ip()                     z.ipv4()        // or z.ipv6()
z.string().ip({ version: 'v4' })   z.ipv4()
z.string().ip({ version: 'v6' })   z.ipv6()
```

New in v4 (no v3 equivalent):
```typescript
z.cidrv4()    // IP range v4
z.cidrv6()    // IP range v6
z.base64url() // base64url encoding
```

### Edge case: chaining after format

Top-level format validators return typed schemas. Additional string refinements like
`.min()`, `.max()` can still be chained where applicable:

```typescript
// If you had additional constraints
z.string().email().min(5)  // ❌
z.email().min(5)           // ✅ still chainable
```

## Number/Integer

### z.int()

`z.int()` returns a `ZodNumber` pre-configured with:
- Integer check
- Range: `[Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]`

All `ZodNumber` refinements chain normally:

```typescript
// ❌ Deprecated                         // ✅ Modern
z.number().int()                         z.int()
z.number().int().positive()              z.int().positive()
z.number().int().nonnegative()           z.int().nonnegative()
z.number().int().positive().max(15)      z.int().positive().max(15)
z.number().int().min(0).max(100)         z.int().min(0).max(100)
z.number().safe()                        z.int()
```

### Fixed-width numeric types (new in v4)

```typescript
z.int()       // safe integer range
z.int32()     // [-2147483648, 2147483647]
z.uint32()    // [0, 4294967295]
z.float32()   // 32-bit float range
z.float64()   // 64-bit float range
z.int64()     // returns ZodBigInt
z.uint64()    // returns ZodBigInt
```

## Object Schema

### strict / passthrough

```typescript
// ❌ Deprecated
z.object({ name: z.string() }).strict()
z.object({ name: z.string() }).passthrough()

// ✅ Modern
z.strictObject({ name: z.string() })
z.looseObject({ name: z.string() })
```

### merge

```typescript
// ❌ Deprecated
const combined = schemaA.merge(schemaB)

// ✅ Modern alternatives
const combined = schemaA.extend(schemaB.shape)
// or
const combined = z.object({ ...schemaA.shape, ...schemaB.shape })
```

## Error Formatting

```typescript
// ❌ Deprecated
error.flatten()
error.format()
error.formErrors

// ✅ Modern
z.treeifyError(error)
```

## Static Factory Methods

```typescript
// ❌ Removed in v4
z.ZodString.create()
z.ZodNumber.create()

// ✅ Use factory functions
z.string()
z.number()
```

## Detection Regex Patterns

Use these patterns to find deprecated usage in codebase:

```
z\.string\(\)\.(uuid|email|url|datetime|date|time|base64|nanoid|cuid2?|ulid|ip|emoji)\(
z\.number\(\)\.(int|safe)\(
\.strict\(\)
\.passthrough\(\)
\.merge\(
\.flatten\(\)
\.format\(\)
\.formErrors
z\.Zod\w+\.create\(
```
