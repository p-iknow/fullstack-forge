---
name: slice-planner
description: Create agent-executable implementation plans for vertical slices. Use when generating detailed session plan files from the slice map, breaking a feature slice into api-spec, db-schema, backend, store-ui, and admin-ui sessions with progressive tasks, data contracts, and verification commands.
---

# Slice Planner

Generate session-level plan files that an AI agent can read and implement in a single session.
One plan file = one agent session = one branch.

## When to Use

- User names a slice (e.g., "plan out 04-cart", "create plans for delivery")
- User says "세부구현", "detailed plan", "session plans" for a slice
- A slice folder under `docs/plans/` exists but is empty

## Workflow

### Step 1: Identify Slice

Read `docs/plans/00-meta/slice-map.md`. Match user input to a slice entry.
Extract: slice number, name, covered domains, dependencies, PRD references.

### Step 2: Read PRD (selective)

PRD 파일 5개를 모두 읽지 않는다. 세션 타입별로 필요한 파일만 읽는다.

| Session type | 필수 PRD 파일 | 참고용 (필요 시) |
|-------------|-------------|----------------|
| api-spec | `02-api.md`, `03-data.md` | `01-overview.md` (business rules) |
| db-schema | `03-data.md` | `01-overview.md` (enums, constraints) |
| backend | `01-overview.md`, `02-api.md` | `05-events.md` (event publishing) |
| store-ui | `04-ui.md` | `02-api.md` (endpoint shapes) |
| admin-ui | `04-ui.md` | `02-api.md` (admin endpoints) |

**읽기 순서**: 먼저 `01-overview.md`를 빠르게 훑어 도메인 전체 구조를 파악한 뒤,
세션별 필수 파일만 상세히 읽는다. 모든 PRD를 미리 다 읽고 시작하지 않는다.

Multi-domain slices: 주 도메인의 PRD만 상세히 읽고, 보조 도메인은 `03-data.md`(관계)만 확인한다.

### Step 3: Check Current State (targeted)

전체 코드베이스를 탐색하지 않는다. 해당 도메인 디렉토리만 확인한다.

```bash
# 도메인별 존재 여부를 빠르게 확인하는 체크리스트
apps/api/src/db/schema/{domain}.ts          # DB schema 존재?
packages/api-spec/src/routes/{domain}/      # API spec 존재?
apps/api/src/routes/{domain}/               # Backend 존재?
apps/store/src/screens/{domain}/            # Store UI 존재?
apps/admin/src/screens/{domain}/            # Admin UI 존재?
```

파일이 있으면 내용을 읽어 PRD 대비 갭을 파악한다. 없으면 clean slate로 진행한다.
패턴 참조 파일(`docs/plans/00-meta/pattern-reference.md`)은 이미 정리되어 있으므로
개별 참조 파일을 탐색하지 말고 pattern-reference.md 하나만 읽는다.

### Step 4: Determine Sessions

The **세션 수** column in slice-map.md is the authoritative source for how many sessions a slice should have.
Do not add or remove sessions beyond what slice-map specifies. If the slice-map says 4 sessions
and the slice has no admin-ui needs, generate exactly 4 (api-spec, db-schema, backend, store-ui).

Base session types (in execution order):

| # | Session | When to Include | Agent Category |
|---|---------|----------------|----------------|
| 01 | api-spec | Always (unless spec exists) | quick |
| 02 | db-schema | When new tables needed (skip if tables exist) | quick |
| 03 | backend | Always | deep |
| 04 | store-ui | When slice has customer-facing UI | visual-engineering |
| 05 | admin-ui | When slice has operator-facing UI | visual-engineering |

### Step 4-b: Enforce 300-Line Limit via Session Splitting

After drafting plans, check each file against the 300-line hard limit.
If a plan exceeds 300 lines, split it into sub-sessions rather than trimming content.
The total session count may increase — this is acceptable as long as each file stays ≤ 300 lines.

**Splitting strategies by session type:**

| Session | Split approach | Naming |
|---------|---------------|--------|
| api-spec | Split by audience: store routes vs admin routes | `01a-api-spec-store.plan.md`, `01b-api-spec-admin.plan.md` |
| db-schema | Split by domain when multi-domain slice | `02a-db-order.plan.md`, `02b-db-payment.plan.md` |
| backend | Split by domain or by CRUD vs business logic | `03a-backend-order.plan.md`, `03b-backend-payment.plan.md` |
| store-ui | Split by page group or flow | `04a-store-checkout.plan.md`, `04b-store-order-list.plan.md` |
| admin-ui | Split by feature area | `05a-admin-orders.plan.md`, `05b-admin-payments.plan.md` |

**Split decision rule:**
1. Draft the plan mentally — estimate line count based on endpoint/table/screen count
2. If a session covers 6+ endpoints, 4+ tables, or 4+ screens, it will likely exceed 300 lines — pre-split
3. Multi-domain slices (e.g., order+payment+inventory) should almost always split backend and api-spec by domain
4. Each sub-session must be independently executable with its own verification and exit criteria

### Step 5: Generate Plans

Create each file at `docs/plans/{nn}-{name}/{nn}-{layer}.plan.md`.
Follow the mandatory format in [references/session-plan-template.md](references/session-plan-template.md).

**속도 최적화 원칙:**
- Plan 파일 간 공통 정보를 반복하지 않는다. 각 세션은 자기 scope만 기술한다.
- 코드 블록은 시그니처 + 핵심 로직만 pseudocode로 작성한다. 전체 구현을 쓰지 않는다.
- Data Contract 테이블은 해당 세션에서 직접 만드는 것만 포함한다.
- 이전 세션의 출력물을 참조할 때는 파일 경로만 적고 내용을 복사하지 않는다.

## Plan Quality Rules

### MUST include

- **Exact file paths** for every file to create/modify
- **Pattern references** pointing to existing files the agent should replicate
- **Error codes** explicitly listed (never "handle errors appropriately")
- **Business rule values** from PRD (never invented)
- **Verification commands** (bash, exact strings)
- **Testable exit criteria** (observable behavior or runnable command)

### MUST NOT include

- Vague instructions ("add appropriate error handling")
- File paths without full path ("add to the handlers file")
- Exit criteria that can't be verified ("code is clean")
- Content from other sessions (each plan is self-contained)

### Constraints

- Each plan file **~300 lines** target. Going over is fine if the content is dense,
  but if a plan approaches 400+ lines it's a signal to consider splitting via Step 4-b.
  Splitting keeps each session focused and achievable in a single agent run.
- Always reference `docs/plans/00-meta/pattern-reference.md` for code patterns
- Every mutation endpoint needs error codes table
- Every DB table needs column specification table
- PRD policy values must cite source (e.g., "최대 15개 — `04-cart/01-overview.md §2`)

## Session-Specific Guidance

### api-spec session

Focus: Zod schemas + createRoute contracts.

- Define reusable schemas in `packages/api-spec/src/{domain}-schemas.ts`
- Define routes in `packages/api-spec/src/routes/{domain}/{resource}/route.ts`
- List every response status code with its error code
- Reference: `packages/api-spec/src/routes/catalog/products/route.ts`

### db-schema session

Focus: Drizzle pgTable + enum + relations.

- Define tables in `apps/api/src/db/schema/{domain}.ts`
- Add relations in `apps/api/src/db/schema/relations.ts`
- Add barrel export in `apps/api/src/db/schema/index.ts`
- Include column table: name, type, constraints, description
- Reference: `apps/api/src/db/schema/product.ts`

### backend session

Focus: Route handlers + helpers + tests.

- Create handlers in `apps/api/src/routes/{domain}/handlers.ts`
- Create route index in `apps/api/src/routes/{domain}/index.ts`
- Create helpers in `apps/api/src/routes/{domain}/@shared/`
- Register in `apps/api/src/app.ts`
- Write tests in `apps/api/src/routes/{domain}/handlers.test.ts`
- For each handler: numbered pseudocode steps (1. validate → 2. query → 3. return)
- Reference: `apps/api/src/routes/catalog/handlers.ts`

### store-ui session

Focus: Pages + API client + query options.

- API client: `apps/store/src/lib/api/{domain}.ts` (types + fetch functions)
- Queries: `apps/store/src/lib/queries/{domain}.ts` (queryOptions + queryKeys)
- Route: `apps/store/src/routes/{path}.tsx` (createFileRoute + Screen import)
- Screen: `apps/store/src/screens/{domain}/{page}.tsx` (component tree)
- Include component tree structure (indented hierarchy showing layout)
- Reference: `apps/store/src/screens/home/home-page.tsx`

### admin-ui session

Same structure as store-ui but under `apps/admin/`. Include only when the slice has operator-facing features. Reference: `apps/admin/src/screens/catalog/admin-catalog-page.tsx`

## References

- [Session Plan Template](references/session-plan-template.md) — mandatory format for all plan files
