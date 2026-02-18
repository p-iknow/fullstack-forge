---
name: frontend-page-structure
description: Apply the screens/ folder structure convention for cohesion-driven page organization. Use when creating new pages, splitting components, deciding file placement, naming files, or organizing shared code with the @shared pattern in frontend apps.
---

# Frontend Page Structure

Cohesion-driven `screens/` folder structure. Routes in `src/routes/` are thin wrappers; actual page components live in `src/screens/`.

## Quick Reference

| Situation                | Structure                                      | Note           |
| ------------------------ | ---------------------------------------------- | -------------- |
| Single page <= 500 lines | `{context}-page.tsx`                           | No splitting   |
| Single page > 500 lines  | `{context}-page.tsx` + `{context}-page.sub/`   | Split to sub   |
| Tab/step multi-view      | `{context}-page.tsx` + `{context}-page.views/` | Rare case      |
| 1 helper                 | `*.helper.ts`                                  | File           |
| 2+ helpers               | `*.helper/`                                    | Folder         |
| 1 UI component           | `*.ui.tsx`                                     | File           |
| 2+ UI components         | `*.ui/`                                        | Folder         |
| Used in 2+ places        | Move to `@shared/` immediately                 | On first reuse |

## Decision Flow

```
1. File <= 500 lines?  → Keep as single file
2. File > 500 lines?   → Split to *.sub/
3. Sub internals > 500? → Split to *.helper.ts, *.ui.tsx
4. Used in 2+ places?  → Move to @shared/
```

### 500-Line Rule (LLM-Optimized)

| Lines   | Tokens | Action             |
| ------- | ------ | ------------------ |
| <= 500  | ~10K   | Keep single file   |
| 500–700 | 10–14K | Consider splitting |
| 700+    | 14K+   | Split recommended  |

## File Layout Inside a Single File

When keeping everything in one file (< 500 lines):

1. Main component (top)
2. Sub UI components
3. Helper functions

## Route → Screen Bridge

```tsx
// src/routes/orders/checkout/intro.tsx — thin wrapper
import { createFileRoute } from '@tanstack/react-router'
import { CheckoutIntroPage } from '~/screens/orders/checkout/intro/checkout-intro-page'

export const Route = createFileRoute('/orders/checkout/intro')({
  component: CheckoutIntroPage,
})
```

> Layout routes (`_layout.tsx`) exist only in `routes/`. No layout files in `screens/`.

## Naming Rules

### Page Files: `{context}-page.tsx`

Files must be self-identifying. Never use generic `page.tsx`.

```
// ✅ File name carries context
orders/checkout/intro/checkout-intro-page.tsx

// ❌ Generic — can't identify from filename alone
orders/checkout/intro/page.tsx
```

### Sub Components: Short filenames, contextual component names

```tsx
// File: checkout-intro-page.sub/header/header.tsx
export const CheckoutIntroHeader = () => {
  /* ... */
}

// File: checkout-intro-page.sub/content/content.tsx
export const CheckoutIntroContent = () => {
  /* ... */
}
```

### Conventions

- Kebab-case filenames (no Korean, no camelCase)
- No `index.ts` barrel exports (tree-shaking, circular ref risks)
- Direct relative imports: `from './header.helper/calculateProgress'`

## Folder Types

| Folder      | Meaning                   | When                                    |
| ----------- | ------------------------- | --------------------------------------- |
| `*.sub/`    | All sub-components        | Default. Page > 500 lines               |
| `*.views/`  | Completely different UIs  | Tabs/steps/conditional rendering (rare) |
| `*.helper/` | Business logic            | Sub internal > 500 lines                |
| `*.ui/`     | Presentational components | Sub internal > 500 lines                |

## File Types

| Type   | Location      | Contains                                       |
| ------ | ------------- | ---------------------------------------------- |
| Main   | `*.tsx`       | State, event handling, render logic            |
| Helper | `*.helper.ts` | Business logic, hooks, constants, calculations |
| UI     | `*.ui.tsx`    | Presentational components                      |
| Types  | `*.types.ts`  | Shared types within page/view (optional)       |
| Test   | `*.test.ts`   | Co-located unit tests                          |
| Event  | `*.event.ts`  | Analytics event constants (optional)           |

## @shared Model

3-tier sharing hierarchy. Move to `@shared/` the moment 2+ consumers exist.

```
src/screens/
├── @shared/              # App-level (all domains)
├── orders/
│   ├── @shared/          # Domain-level (all order pages)
│   └── checkout/
│       ├── @shared/      # Feature-level (checkout pages)
│       ├── intro/
│       └── result/
```

| @shared type | Complexity | Structure     | Example        |
| ------------ | ---------- | ------------- | -------------- |
| `ui/`        | Simple     | Single file   | `OrderBadge`   |
| `sub/`       | Complex    | Folder        | `OrderSummary` |
| `views/`     | Full view  | Folder (rare) | `ErrorView`    |

Cross-app sharing (store + admin) → `packages/design-system` or `packages/shared`.

## Anti-Patterns

- **Over-nesting**: Max practical depth is page → sub → helper/ui. No deeper.
- **Premature splitting**: Don't split files under 500 lines.
- **Premature @shared**: Don't put single-use components in @shared.
- **Barrel exports**: No `index.ts` re-exports.
- **Generic filenames**: No `page.tsx`, `component.tsx` without context.

## Reference

- [Full directory examples and detailed guides](references/page-structure-detail.md)
