# Cart — API Spec Session: Learnings

## 구현 요약

- `packages/api-spec/src/cart-schemas.ts` — 6개 Zod 스키마 (cartStatus, cartItemStockDisplay, cartItem, cartResponse, addCartItemRequest, updateCartItemRequest, cartError, cartItemIdParams)
- `packages/api-spec/src/routes/cart/cart/route.ts` — GET / (cart 조회), DELETE / (cart 비우기)
- `packages/api-spec/src/routes/cart/items/route.ts` — POST /items, PATCH /items/{cartItemId}, DELETE /items/{cartItemId}
- `packages/api-spec/src/routes/cart/index.ts` — re-export
- `packages/api-spec/package.json` — `./cart-schemas`, `./routes/cart` export 추가

## 배운 점

### 1. Route Path는 마운트 포인트 기준으로 상대 경로를 사용한다

처음에 route path를 `/cart`, `/cart/items` 등 절대 경로로 작성했다. 이 접근은 `app.route('/', cartIndex)`로 마운트할 때는 동작하지만, `app.route('/cart', cartIndex)`로 마운트하면 최종 경로가 `/cart/cart`가 되어 의도와 다르다.

**올바른 패턴**: admin 라우터처럼 상대 경로 사용.
- Route path: `/`, `/items`, `/items/{cartItemId}`
- Mount: `app.route('/cart', cartIndex)`
- 최종: `/cart`, `/cart/items`, `/cart/items/{cartItemId}`

이 패턴은 라우터가 자체 미들웨어(`use('*', requireAuth)`)를 안전하게 적용할 수 있게 해준다. `/`에 마운트하면 `use('*', ...)`가 `/openapi.json` 같은 다른 경로까지 잡는 부작용이 발생한다.

### 2. package.json exports에 수동 등록이 필요하다

`sync:exports` 스크립트는 generated client만 처리한다. 수동으로 작성한 schema/route export는 직접 `package.json`의 `exports` 필드에 추가해야 한다.

### 3. Zod 스키마 네이밍 컨벤션

기존 패턴 관찰:
- `catalog-schemas.ts`: `catalogProductSummarySchema`, `catalogErrorSchema`
- `auth-schemas.ts`: `authErrorSchema`, `authUserSchema`

**패턴**: `{domain}{Entity}{Type}Schema`. cart도 동일하게 `cartItemSchema`, `cartResponseSchema`, `cartErrorSchema`.

### 4. Error 스키마는 도메인별로 분리한다

`authErrorSchema`와 `catalogErrorSchema`가 동일한 `{ code: string, error: string }` 구조임에도 별도로 정의되어 있다. OpenAPI 문서에서 도메인별 에러 응답을 명확히 구분하기 위함. `cartErrorSchema`도 동일 구조로 별도 정의했다.

### 5. codegen 파이프라인 이해

`pnpm nx run @fullstack-forge/api-spec:codegen` 실행 시:
1. `extract-openapi.ts` — Hono 앱을 부팅하고 GET /openapi.json 호출
2. `openapi-typescript` — YAML → TypeScript 타입 생성
3. `generate-openapi-clients.mjs` — hey-api로 도메인별 SDK 생성
4. `sync:exports` — generated client의 export만 자동 동기화

cart는 아직 generated client가 없으므로 (3)에서 처리되지 않는다. 수동 API client 패턴(store의 `lib/api/cart.ts`)으로 대체.
