---
name: frontend-design
description: Build production-grade frontend UI with project-aligned design tokens, accessibility, dark mode, and complete component states for Base UI and shadcn patterns. Use when users ask for polish, accessibility, state completeness, token consistency, dark mode quality, component hardening, or WCAG compliance in apps/store, apps/admin, or packages/design-system. Also use when building new components or pages that need to follow project token conventions, even if the user doesn't explicitly mention "design tokens" or "accessibility".
---

# Frontend Design

Production-quality frontend implementation skill. For creative direction, pair with `frontend-ui-ux`.

## Project Stack

- Tailwind CSS v4 (`@import 'tailwindcss'`), OKLCH color model
- CSS custom properties in `:root` / `.dark`, mapped via `@theme inline`
- Base UI + CVA variants + `cn()` utility
- Token source of truth: `packages/design-system/src/styles/globals.css`

## Available Tokens

These semantic tokens are already defined — use them instead of raw colors. Only read `globals.css` when you need to **add** a new token.

**Surfaces**: `background`, `foreground`, `card`, `card-foreground`, `popover`, `popover-foreground`, `muted`, `muted-foreground`
**Actions**: `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `accent`, `accent-foreground`, `destructive`, `destructive-foreground`
**Borders/Input**: `border`, `input`, `ring`
**Charts**: `chart-1` through `chart-5`
**Sidebar**: `sidebar`, `sidebar-foreground`, `sidebar-primary`, `sidebar-primary-foreground`, `sidebar-accent`, `sidebar-accent-foreground`, `sidebar-border`, `sidebar-ring`
**Typography**: `--font-sans` (Geist), `--font-heading` (Geist), `--font-mono`
**Radius**: `--radius` (0.75rem) → `radius-sm`, `radius-md`, `radius-lg`, `radius-xl`
**Shadows**: `shadow-2xs` through `shadow-2xl`
**Layout classes**: `heading-xl/lg/md/sm`, `container-padding-x`, `section-padding-y`

## Design Principles

1. **Token-first** — Use semantic tokens (`bg-background`, `text-foreground`, `bg-primary`), never hardcoded colors. This keeps dark mode working automatically.
2. **Complete states** — Interactive elements: default, hover, active, focus-visible, disabled. Async elements: add loading, error, empty states.
3. **Dark mode via tokens** — `.dark` overrides in globals.css, not ad-hoc color swaps.
4. **WCAG 2.2 AA** — Semantic HTML first, ARIA when needed. Keep `:focus-visible` indicators. AA contrast (4.5:1 normal, 3:1 large text).
5. **Motion safety** — Use `motion-reduce:transition-none` or `motion-reduce:animate-none` on transitions. Prefer transform/opacity over layout-triggering properties.

## Workflow

1. **Check tokens** — Scan the token list above. Only read `globals.css` if you need to add a new token (update `:root`, `.dark`, and `@theme inline` together).
2. **Semantic structure** — Meaningful landmarks, heading order, `<article>`/`<section>` where appropriate.
3. **Build with CVA** — Use CVA for variants/sizes. Keep variant APIs typed and predictable.
4. **State coverage** — Implement all applicable states. Use `motion-reduce:*` for any new animations.
5. **Package boundaries** — Don't import app-specific patterns into `packages/design-system`.

### CVA pattern reference

```tsx
const badgeVariants = cva('inline-flex items-center rounded-md text-sm font-medium', {
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground',
      outline: 'border border-border bg-background text-foreground',
    },
  },
  defaultVariants: { variant: 'default' },
})
```

### Adding a new token (all three layers)

```css
/* 1. @theme inline */
--color-success: var(--success);
/* 2. :root */
--success: oklch(0.72 0.19 142);
/* 3. .dark */
--success: oklch(0.65 0.17 142);
```

## References

Read only when needed:

- **Creative direction** (style spectrum, anti-slop): `references/creative-direction.md`
- **Motion/a11y deep-dive** (reduced-motion CSS, state checklist, contrast rules): `references/motion-accessibility.md`
- **Layout conventions**: `../frontend-style-layout/SKILL.md`
