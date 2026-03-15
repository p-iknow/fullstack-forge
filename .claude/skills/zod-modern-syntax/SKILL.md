---
name: zod-modern-syntax
description: Enforce Zod v4 modern syntax by detecting and migrating deprecated v3
  patterns. Use when writing or reviewing Zod schemas, creating API spec schemas,
  or migrating existing schemas to Zod v4 top-level APIs. Triggers include
  "zod schema", "z.string().uuid()", "z.number().int()", "deprecated zod",
  "zod migration", "zod v4", and when editing files in packages/api-spec.
---

# Zod Modern Syntax

Detect deprecated Zod v3 patterns and enforce Zod v4 idiomatic APIs across the project.

This project uses **Zod v4** (`^4.1.5` in pnpm-workspace.yaml catalog).

## Migration Rules

### 1. String Format Validators → Top-Level APIs

String format methods are deprecated. Use top-level `z` namespace functions.

| Deprecated (v3)            | Modern (v4)          |
| -------------------------- | -------------------- |
| `z.string().uuid()`        | `z.uuid()`           |
| `z.string().email()`       | `z.email()`          |
| `z.string().url()`         | `z.url()`            |
| `z.string().datetime()`    | `z.iso.datetime()`   |
| `z.string().date()`        | `z.iso.date()`       |
| `z.string().time()`        | `z.iso.time()`       |
| `z.string().base64()`      | `z.base64()`         |
| `z.string().nanoid()`      | `z.nanoid()`         |
| `z.string().cuid()`        | `z.cuid()`           |
| `z.string().cuid2()`       | `z.cuid2()`          |
| `z.string().ulid()`        | `z.ulid()`           |
| `z.string().ip()`          | `z.ipv4()` / `z.ipv6()` |
| `z.string().emoji()`       | `z.emoji()`          |

### 2. Number/Integer → Top-Level `z.int()`

| Deprecated (v3)            | Modern (v4)          |
| -------------------------- | -------------------- |
| `z.number().int()`         | `z.int()`            |
| `z.number().safe()`        | `z.int()`            |

`z.int()` returns `ZodNumber`, so all number refinements chain normally:

```typescript
// ❌ Deprecated
z.number().int().positive().max(15)
z.number().int().nonnegative()

// ✅ Modern
z.int().positive().max(15)
z.int().nonnegative()
```

### 3. Object Method Deprecations

| Deprecated (v3)                             | Modern (v4)                       |
| ------------------------------------------- | --------------------------------- |
| `z.object({...}).strict()`                  | `z.strictObject({...})`           |
| `z.object({...}).passthrough()`             | `z.looseObject({...})`            |
| `z.object({...}).merge(otherSchema)`        | `z.object({...}).extend(other.shape)` or spread |

### 4. Error Formatting

| Deprecated (v3)      | Modern (v4)           |
| -------------------- | --------------------- |
| `error.flatten()`    | `z.treeifyError(error)` |
| `error.format()`     | `z.treeifyError(error)` |
| `error.formErrors`   | `z.treeifyError(error)` |

### 5. Other Deprecations

| Deprecated (v3)              | Modern (v4)         |
| ---------------------------- | ------------------- |
| `z.ZodString.create()`      | `z.string()`        |
| Any `.create()` static call | Use factory function |

## Workflow

### Audit existing file

1. Read the target file
2. Scan for deprecated patterns listed above
3. Report each occurrence with line number, deprecated code, and replacement
4. Apply fixes preserving all refinements (`.min()`, `.max()`, `.positive()`, `.optional()`, etc.)

### Write new schema

When writing new Zod schemas, always use the modern v4 syntax from the start:

```typescript
// ✅ Modern Zod v4 schema example
import { z } from 'zod'

export const productSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(200),
  price: z.int().nonnegative(),
  sku: z.string(),
  imageUrl: z.url(),
  createdAt: z.iso.datetime(),
})
```

### Batch audit

To audit all schema files at once, scan `packages/api-spec/src/**/*.ts` for deprecated patterns.

## Migration Reference

Full deprecated-to-modern mapping with edge cases → [references/migration-map.md](references/migration-map.md)
