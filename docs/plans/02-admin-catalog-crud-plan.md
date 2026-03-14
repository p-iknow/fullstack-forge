# Admin Catalog CRUD Implementation Plan

## Scope

- Roadmap step: admin 상품/카테고리 관리 기능 (CRUD + 이미지 업로드).
- In scope: `categories` 테이블 생성, product CRUD API, category CRUD API, image upload API, admin management UI.
- Out of scope: inventory adjustment, admin auth middleware (RBAC), recommendation/ranking, bulk import/export.

## Unit Dependency Map

- Unit 1 (Categories Schema & CRUD API) → Unit 2 (Product Write API & Image Upload) → Unit 3 (Admin Management UI) → Stage gate.

## Unit 1 - Categories Schema & CRUD API

### Step Objective

- `categories` 테이블을 생성하고, 기존 `products.categoryId` 텍스트를 FK로 마이그레이션한다.
- 카테고리 CRUD 엔드포인트를 추가하고, 기존 `GET /categories`가 새 테이블에서 조회하도록 전환한다.

### Prerequisite

- [ ] `01-catalog-implementation-plan` 완료 (catalog read API + store/admin UI 동작 중).
- [ ] `apps/api/src/db/schema/product.ts` 의 products/inventory 스키마 확인.

### References

- `docs/01-prd/02-catalog/01-overview.md` — §2 카테고리 정책 (6종, slug 규칙).
- `docs/01-prd/02-catalog/03-data.md` — 카테고리 데이터 모델.
- `apps/api/src/db/schema/product.ts` — 현재 products 스키마.
- `apps/api/src/db/seed-product-catalog.ts` — 현재 카테고리 seed 데이터 (하드코딩 `cat-1`~`cat-6`).

### Progressive Tasks

1. `apps/api/src/db/schema/category.ts` 에 `categories` Drizzle 스키마 생성.
   - 컬럼: `id` (uuid, PK), `name` (text), `slug` (text, unique), `displayOrder` (integer), `isActive` (boolean, default true), `createdAt` (timestamp).
2. `products.categoryId` 를 `categories.id` FK로 변경하는 마이그레이션 생성 및 적용.
3. `apps/api/src/db/seed.ts` 에서 categories 테이블을 먼저 seed 한 뒤 products가 FK를 참조하도록 수정.
4. `packages/api-spec/src/admin-catalog-schemas.ts` 생성 — 카테고리 CRUD request/response Zod 스키마 정의.
5. `packages/api-spec/src/routes/admin/categories/` 에 route contract 추가.
   - `POST /admin/categories` — 카테고리 생성.
   - `PATCH /admin/categories/:id` — 카테고리 수정.
   - `DELETE /admin/categories/:id` — 카테고리 삭제.
6. `apps/api/src/routes/admin/categories/` 에 handler 구현.
7. 기존 `GET /categories` handler를 새 `categories` 테이블에서 조회하도록 전환.
8. `apps/api/src/app.ts` 에 admin category routes 등록.
9. 카테고리 CRUD handler 테스트 작성.

### Exit Criteria

- [ ] `categories` 테이블 존재, 6개 seed 카테고리 포함.
- [ ] `products.categoryId` 가 `categories.id` FK를 참조.
- [ ] `POST/PATCH/DELETE /admin/categories` 정상 응답.
- [ ] 기존 `GET /categories` 가 새 테이블 기반으로 동작.
- [ ] typecheck/build/test 통과.

### Evidence

- 마이그레이션 파일.
- 카테고리 handler 파일 및 테스트.
- seed 데이터 업데이트 확인.

### Output for Next Step

- 안정적인 `categories` 테이블 및 CRUD API — Unit 2에서 product 생성 시 카테고리 참조 가능.

## Unit 2 - Product Write API & Image Upload

### Step Objective

- 상품 CRUD 엔드포인트 및 이미지 업로드 엔드포인트를 구현한다.
- 이미지는 MinIO에 업로드하고 sharp로 리사이즈/WebP 변환한다.

### Prerequisite

- [ ] Unit 1 완료 (categories 테이블 및 CRUD 동작).

### References

- `docs/01-prd/02-catalog/01-overview.md` — §2 SKU 정책, §4 상품 상태/판매조건.
- `apps/api/src/lib/s3-client.ts` — 기존 MinIO 클라이언트 (`s3`, `publicUrl`, `MINIO_BUCKET`).
- `apps/api/src/lib/product-image.ts` — fallback 이미지 키, URL 헬퍼.
- `apps/api/src/db/seed-product-images.ts` — 기존 이미지 생성/업로드 패턴 (`PutObjectCommand`, `sharp`).
- `apps/api/src/routes/auth/signup/handler.ts` — POST handler 패턴 참고.

### Progressive Tasks

1. `packages/api-spec/src/admin-catalog-schemas.ts` 에 product write Zod 스키마 추가.
   - `createProductRequestSchema`: name, description, price, categoryId, isSubstitutable.
   - `updateProductRequestSchema`: 동일 필드 (partial).
   - `updateProductStatusRequestSchema`: status (enum).
   - 공통 응답: product 전체 필드.
   - 에러 응답: `{ code, error }` 패턴.
2. `packages/api-spec/src/routes/admin/products/` 에 route contract 추가.
   - `POST /admin/products` — 상품 생성 (201, 400, 409).
   - `PATCH /admin/products/:id` — 상품 수정 (200, 400, 404).
   - `PATCH /admin/products/:id/status` — 상태 변경 (200, 400, 404).
   - `DELETE /admin/products/:id` — 상품 삭제 (204, 404, 409).
3. `apps/api/src/routes/admin/products/` 에 handler 구현.
   - 생성: products + inventory 레코드 동시 insert, fallback 이미지 URL 기본값 할당.
   - 수정: products 레코드 update.
   - 상태 변경: status enum 유효성 검증 후 update.
   - 삭제: orderItems 참조가 있으면 409, 없으면 cascade delete (inventory 포함).
4. `POST /admin/products/:id/images` — 이미지 업로드 엔드포인트.
   - multipart form data 수신 (`c.req.parseBody()` — Hono built-in).
   - 파일 유효성 검증: JPEG/PNG/WebP, 최대 5MB.
   - sharp로 리사이즈: thumb (400×400, cover), detail (800×600, cover), WebP 변환.
   - MinIO에 `PutObjectCommand`로 업로드 (키: `sku-{productId}-thumb.webp`, `sku-{productId}-detail.webp`).
   - products 레코드의 `thumbUrl`, `detailUrl` 업데이트.
5. `apps/api/src/app.ts` 에 admin product routes 등록.
6. Product CRUD + 이미지 업로드 handler 테스트 작성.

### Exit Criteria

- [ ] `POST/PATCH/DELETE /admin/products` 정상 응답.
- [ ] 상품 생성 시 inventory 레코드 자동 생성 (onHand=0, reserved=0).
- [ ] 이미지 업로드 시 MinIO에 파일 생성, DB URL 갱신.
- [ ] 주문 이력이 있는 상품은 삭제 불가 (409).
- [ ] typecheck/build/test 통과.

### Evidence

- Product handler 파일 및 테스트.
- Image upload handler (sharp 처리 + MinIO 업로드 로직).
- MinIO 업로드 검증 로그.

### Output for Next Step

- 전체 write API 표면 — Unit 3 admin UI에서 소비 가능.

## Unit 3 - Admin Catalog Management UI

### Step Objective

- 관리자가 상품과 카테고리를 생성/수정/삭제하고 이미지를 업로드할 수 있는 admin UI를 구현한다.

### Prerequisite

- [ ] Unit 2 완료 (product/category CRUD + image upload API 동작).

### References

- `docs/01-prd/02-catalog/04-ui.md` — §4 admin 상품 관리 화면.
- `apps/store/src/screens/auth/signup/signup-page.tsx` — mutation + react-hook-form 패턴.
- `apps/store/src/lib/queries/auth.ts` — mutation options factory 패턴.
- `apps/admin/src/screens/catalog/admin-catalog-page.tsx` — 기존 목록 페이지 (확장 대상).

### Progressive Tasks

1. `apps/admin/src/lib/api/catalog.ts` 에 write API 클라이언트 함수 추가.
   - `createProduct`, `updateProduct`, `updateProductStatus`, `deleteProduct`.
   - `uploadProductImages` (FormData 전송).
   - `createCategory`, `updateCategory`, `deleteCategory`.
2. `apps/admin/src/lib/queries/catalog.ts` 에 mutation options factory 추가.
   - `createProductMutationOptions`, `updateProductMutationOptions`, etc.
   - `onSuccess`에서 관련 query invalidation (`queryClient.invalidateQueries`).
3. 상품 생성 페이지: `/admin/products/new` route + screen.
   - react-hook-form + Zod validation.
   - 카테고리 select (API에서 카테고리 목록 조회).
   - 이미지 업로드 영역 (thumb + detail, 드래그앤드롭 또는 파일 선택).
   - 이미지 미리보기.
4. 상품 수정 페이지: `/admin/products/:id/edit` route + screen.
   - 기존 데이터 pre-fill.
   - 이미지 교체 기능 (현재 이미지 표시 + 새 파일 업로드).
5. 기존 목록 페이지(`admin-catalog-page.tsx`)에 액션 추가.
   - "상품 등록" 버튼 → 생성 페이지로 이동.
   - 각 행에 "수정" / "삭제" 액션.
   - 상태 변경 드롭다운 또는 배지 클릭 → status PATCH.
   - 삭제 확인 다이얼로그.
6. 카테고리 관리 페이지: `/admin/categories` route + screen.
   - 카테고리 목록 테이블 + 인라인 생성/수정/삭제.
7. 네비게이션에 카테고리 관리 링크 추가.
8. 새 UI 컴포넌트 테스트 작성.

### Exit Criteria

- [ ] Admin에서 상품 생성/수정/삭제 가능.
- [ ] Admin에서 상품 이미지 업로드 가능 (thumb + detail), 미리보기 동작.
- [ ] Admin에서 상품 상태 변경 가능.
- [ ] Admin에서 카테고리 생성/수정/삭제 가능.
- [ ] 기존 상품 목록/필터 기능 유지.
- [ ] typecheck/build/test 통과.

### Evidence

- Admin screen/component 파일.
- API client 및 mutation options 파일.
- UI 테스트.

### Output for Next Step

- Admin 카탈로그 관리 전체 기능 완성.

## Stage Gate

- [ ] API/build/typecheck/tests 전체 통과.
- [ ] Admin에서 상품 전체 lifecycle 수행 가능: 생성 → 이미지 업로드 → 수정 → 상태 변경 → 삭제.
- [ ] Admin에서 카테고리 lifecycle 수행 가능: 생성 → 수정 → 삭제.
- [ ] 기존 store catalog 읽기 기능에 영향 없음.
- [ ] `categories` 테이블 마이그레이션 정상 적용, seed 데이터 호환.

## Notes

- Admin 인증/인가(RBAC)는 별도 concern으로 분리. 현재 admin route에 auth guard가 없으면 이 plan과 별개로 추가 필요.
- 상품 삭제 전략: `orderItems` 참조가 있는 상품은 hard delete 불가 → 409 반환. 운영상 `discontinued` 상태 변경을 권장.
- 이미지 제약: JPEG/PNG/WebP 허용, 파일당 최대 5MB, sharp로 WebP 변환 후 MinIO 업로드.
- Inventory adjustment(재고 조정)는 inventory 도메인 plan에서 다룬다.
- 이 plan은 `01-catalog-implementation-plan.md` Notes에서 명시적으로 defer한 "schema-level category table introduction"을 해소한다.
