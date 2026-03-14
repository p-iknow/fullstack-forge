# PRD File-Type Completeness Checklist

## 01-overview.md

- [ ] Purpose statement (why this domain exists)
- [ ] Core business rules with concrete values (not "appropriate" but "5 units")
- [ ] Lifecycle/state diagram with ALL states and transitions
- [ ] Transition trigger table (what event causes each transition, who triggers it)
- [ ] Concurrency/conflict resolution policy
- [ ] Related domain section with bidirectional references
- [ ] MVP scope (included vs excluded)
- [ ] Edge cases: zero values, max limits, boundary conditions
- [ ] Failure scenarios: what happens when dependent domain fails
- [ ] Recovery policy: how to recover from inconsistent state

## 02-api.md

- [ ] All CRUD endpoints for the domain entity
- [ ] Read endpoints: pagination, filtering, sorting params
- [ ] Write endpoints: request validation rules
- [ ] Error responses: status codes and error body format per endpoint
- [ ] Authentication/authorization requirements per endpoint
- [ ] Rate limiting policy (if applicable)
- [ ] Idempotency requirements for write operations
- [ ] Store (customer) vs Admin endpoint separation
- [ ] Batch operations (if applicable)
- [ ] API versioning strategy

## 03-data.md

- [ ] All entity fields with types (not just names)
- [ ] Required vs optional fields
- [ ] Field constraints (min/max length, allowed values, format)
- [ ] Derived/computed fields clearly marked
- [ ] Relationships to other entities (FK references)
- [ ] Unique constraints and indexes
- [ ] Soft delete vs hard delete policy
- [ ] Audit fields (created_at, updated_at, created_by)
- [ ] Data retention policy
- [ ] Migration considerations for schema changes

## 04-ui.md

- [ ] Target user role (admin/customer/both)
- [ ] Screen inventory (list of all screens/views)
- [ ] Information hierarchy per screen
- [ ] Empty state handling (no data, first use)
- [ ] Error state display (API failure, validation error)
- [ ] Loading state behavior
- [ ] Confirmation dialogs for destructive actions
- [ ] Access control per screen/action
- [ ] Responsive behavior (mobile/desktop)
- [ ] Real-time update behavior (polling/websocket/manual refresh)
- [ ] Bulk actions (select multiple, batch operation)
- [ ] Search and filter UX
- [ ] Sorting behavior and defaults

## 05-events.md

- [ ] Complete event inventory (all domain events)
- [ ] Event envelope format reference
- [ ] Per-event: trigger timing (before/after what action)
- [ ] Per-event: full payload with field types
- [ ] Per-event: consumer list with what each consumer does
- [ ] Per-event: idempotency key definition
- [ ] Topic/queue routing
- [ ] Retry policy per event type
- [ ] DLQ handling for failed events
- [ ] Event ordering guarantees (or lack thereof)
- [ ] Event versioning strategy for payload changes

## Cross-Domain Checks

- [ ] Events published here are consumed in other domain's `05-events.md`
- [ ] Events consumed here are published in source domain's `05-events.md`
- [ ] Shared numeric thresholds reference single source (usually `00-overview.md`)
- [ ] State names are consistent between overview lifecycle and data model
- [ ] API triggers in `02-api.md` match event triggers in `05-events.md`
- [ ] UI fields in `04-ui.md` are all present in `03-data.md` (or computed)
- [ ] Related domains section is bidirectional
