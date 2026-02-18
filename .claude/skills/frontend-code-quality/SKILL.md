---
name: frontend-code-quality
description: Apply Toss Frontend Fundamentals code quality principles when writing or reviewing React/TypeScript code. Use when refactoring components, reviewing pull requests, checking readability of functions, evaluating predictability of interfaces, improving cohesion of related code, or reducing coupling between modules. Triggers include "code quality", "code review", "refactor for readability", "reduce coupling", and "frontend fundamentals".
---

# Frontend Code Quality

Good frontend code is **easy to change**. Evaluate against 4 principles: Readability, Predictability, Cohesion, Coupling.

Source: [Toss Frontend Fundamentals](https://frontend-fundamentals.com/code-quality/)

## 4 Principles

### 1. Readability

Minimize cognitive load per function/component. A reader should understand behavior at a glance.

| Rule                            | Action                                                                  |
| ------------------------------- | ----------------------------------------------------------------------- |
| Separate non-co-executing code  | Split components by execution path into separate components             |
| Abstract implementation details | Extract cross-cutting concerns (auth, logging) into HOC/wrapper         |
| Split multi-concern functions   | One hook per responsibility, not one per "page"                         |
| Name complex conditions         | Extract `&&`/`\|\|` chains into named booleans (`isSameCategory`)       |
| Name magic numbers              | Replace raw numbers with constants (`ANIMATION_DELAY_MS = 300`)         |
| Reduce eye-travel               | Keep conditions and effects in same scope; avoid multi-file indirection |
| Simplify ternaries              | Replace nested ternaries with IIFE + early returns                      |
| Order comparisons naturally     | Write `min <= x && x <= max` not `x >= min && x <= max`                 |

See [references/readability.md](references/readability.md) for before/after code examples.

### 2. Predictability

Functions should behave exactly as their name, params, and return type suggest.

| Rule                  | Action                                                 |
| --------------------- | ------------------------------------------------------ |
| Avoid name collisions | Don't shadow library names with custom wrappers        |
| Unify return types    | Same-kind functions must return the same shape         |
| Expose hidden logic   | Don't embed side effects inside pure-looking functions |

See [references/predictability.md](references/predictability.md) for before/after code examples.

### 3. Cohesion

Code that changes together should live together.

| Rule                        | Action                                                                        |
| --------------------------- | ----------------------------------------------------------------------------- |
| Co-locate co-modified files | Domain-based directories (`domains/X/hooks/`) over type-based (`hooks/`)      |
| Eliminate magic numbers     | Extract shared constants so changes propagate everywhere                      |
| Choose form cohesion level  | Field-level for independent validation; form-level for tightly coupled fields |

See [references/cohesion.md](references/cohesion.md) for before/after code examples.

### 4. Coupling

Minimize the blast radius of changes.

| Rule                        | Action                                                       |
| --------------------------- | ------------------------------------------------------------ |
| One responsibility per unit | Split "page state" hooks by concern                          |
| Allow duplication           | Don't prematurely abstract code that may diverge per-page    |
| Eliminate props drilling    | Use composition (children) first, Context API as last resort |

See [references/coupling.md](references/coupling.md) for before/after code examples.

## When Principles Conflict

These 4 principles cannot all be maximized simultaneously.

| Tension                    | Trade-off                                                                                                                                      |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Cohesion vs Readability    | Abstracting for cohesion reduces readability. Prioritize cohesion when co-modification bugs are likely; otherwise favor readability.           |
| Coupling vs Cohesion       | Duplication reduces coupling but lowers cohesion. Allow duplication when pages may diverge; consolidate when behavior is guaranteed identical. |
| Readability vs Abstraction | Over-abstraction hides details but increases eye-travel. Abstract only when reader needs fewer than 6-7 concepts at once.                      |

**Decision heuristic**: _"What makes this code easier to change safely in 6 months?"_

## Code Smell Detection

Check for these patterns during code review:

- Multiple interleaved `if (isX)` branches → Separate non-co-executing code
- Deep callback nesting in component → Abstract implementation details
- Hook named `usePageState` or `usePageData` → Split by concern
- Raw numbers in `delay()`, array indices, config → Name magic numbers
- Nested ternary `a ? b : c ? d : e` → Simplify to if/return
- Custom wrapper with same name as library → Rename to avoid confusion
- Similar hooks returning different shapes → Unify return types
- Side effects inside fetcher functions → Expose hidden logic
- All files in flat `hooks/`, `components/`, `utils/` → Co-locate by domain
- Props passed through 3+ component levels → Use composition or Context
- Shared hook with growing parameter list → Allow duplication instead
