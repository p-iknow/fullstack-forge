# Catalog Implementation Plan

## Scope

- Roadmap step: PRD `docs/01-prd/02-catalog` implementation.
- In scope: `GET /products`, `GET /products/{id}`, `GET /products/search`, `GET /categories`, store catalog UI, admin catalog management UI.
- Out of scope: recommendation/ranking algorithm, inventory mutation logic.

## Unit Dependency Map

- Unit 1 (API contract + backend handlers) -> Unit 2 (store UI) -> Unit 3 (admin UI) -> Stage gate.

## Unit 1 - Catalog API

### Step Objective

- Implement catalog read APIs with filtering, pagination, sorting, and sales eligibility projection.

### Prerequisite

- Existing `products` and `inventory` schema in `apps/api/src/db/schema/product.ts`.

### References

- `docs/01-prd/02-catalog/01-overview.md`
- `docs/01-prd/02-catalog/02-api.md`
- `docs/01-prd/02-catalog/03-data.md`
- `docs/02-architecture/backend/07-catalog-policy.adr.md`

### Progressive Tasks

- Add catalog route contracts in `packages/api-spec/src/routes/catalog`.
- Register `@fullstack-forge/api-spec/routes/catalog` export.
- Add API handlers in `apps/api/src/routes/catalog`.
- Wire catalog routes in `apps/api/src/app.ts`.

### Exit Criteria

- All four catalog endpoints respond with contract-compliant payloads.
- Filtering by query/category/status/brand works.
- Pagination and sorting defaults match PRD.

### Evidence

- API route files and handler files.
- Backend tests covering list/detail/search/categories behavior.

### Output for Next Step

- Stable `/api/products*` and `/api/categories` for frontend consumption.

## Unit 2 - Store Catalog UI

### Step Objective

- Implement store catalog list and detail views with consistent out-of-stock display policy.

### Prerequisite

- Unit 1 complete.

### References

- `docs/01-prd/02-catalog/04-ui.md`

### Progressive Tasks

- Add store catalog API client functions.
- Update home route to product list with filters.
- Add product detail route and page.
- Show out_of_stock/discontinued purchase-disabled state.

### Exit Criteria

- Store list supports query/category/brand/status filters.
- Store detail shows required product fields and images.

### Evidence

- Store route and screen files.
- Store tests for list/detail rendering and filter behavior.

### Output for Next Step

- Catalog UI baseline reusable by admin ops flow.

## Unit 3 - Admin Catalog Management UI

### Step Objective

- Implement admin product listing, search, and filter visibility.

### Prerequisite

- Unit 1 complete.

### References

- `docs/01-prd/02-catalog/04-ui.md`

### Progressive Tasks

- Add admin catalog API client functions.
- Replace admin index with product management list + filter controls.
- Show product status and category distribution context.

### Exit Criteria

- Admin can inspect products with category/status filters and search query.

### Evidence

- Admin route/screen updates.

### Output for Next Step

- Stage 2 catalog visibility baseline delivered.

## Stage Gate

- API/build/typecheck/tests pass for changed packages/apps.
- PRD Stage 2 catalog exit criteria traceable to implemented behavior.

## Notes

- This plan intentionally keeps inventory write/reservation logic in inventory domain.
- Any schema-level category table introduction is deferred to a dedicated migration-focused plan.
