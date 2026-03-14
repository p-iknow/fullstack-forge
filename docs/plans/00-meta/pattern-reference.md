# Pattern Reference Guide

모든 세션 plan에서 공통으로 참조하는 코드베이스 패턴 가이드.
Agent는 이 문서를 먼저 읽고, 각 세션 plan의 Progressive Tasks를 실행한다.

## 1. 프로젝트 구조

```
apps/
├── api/          # Hono backend (apps/api/src/)
├── store/        # TanStack Start 고객 앱 (apps/store/src/)
└── admin/        # TanStack Start 운영 앱 (apps/admin/src/)
packages/
├── api-spec/     # API 계약 (Zod schemas + route definitions)
└── design-system/ # 공유 UI 컴포넌트 라이브러리
```

## 2. API Spec Pattern

**참조**: `packages/api-spec/src/routes/catalog/products/route.ts`

### Route Contract 정의

```typescript
import { createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import { myResponseSchema, myErrorSchema } from '../../../my-schemas'

// 1. Request 스키마 (query/params/body)
export const myQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  page_size: z.coerce.number().int().positive().max(100).optional(),
})

export const myParamsSchema = z.object({
  id: z.string().uuid(),
})

// 2. Route 정의
export const getMyRoute = createRoute({
  method: 'get',
  path: '/my-resource',
  request: { query: myQuerySchema },
  responses: {
    200: {
      description: 'Success',
      content: { 'application/json': { schema: myResponseSchema } },
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: myErrorSchema } },
    },
  },
})
```

### Zod Schema 정의

**참조**: `packages/api-spec/src/catalog-schemas.ts`

- 도메인별 `{domain}-schemas.ts` 파일에 reusable schema 정의
- Response schema와 Error schema를 분리
- `.extend()`로 기존 schema 확장

### Route Export

**참조**: `packages/api-spec/src/routes/catalog/index.ts`

```typescript
export {
  getProductsRoute,
  getProductByIdRoute,
} from './products/route'
```

### Codegen Pipeline

```bash
pnpm nx run @fullstack-forge/api-spec:codegen
# 1. @hono/zod-openapi route → OpenAPI YAML 생성
# 2. openapi-typescript → TypeScript types 생성
# 결과: packages/api-spec/generated/
```

## 3. Backend Handler Pattern

### Route Registration

**참조**: `apps/api/src/routes/catalog/index.ts`

```typescript
import { createRouter } from '~/lib/create-app'
import { getProductsRoute } from '@fullstack-forge/api-spec/routes/catalog'
import { getProductsHandler } from './handlers'

export const catalogIndex = createRouter()
catalogIndex.openapi(getProductsRoute, getProductsHandler)
```

### Handler 구현

**참조**: `apps/api/src/routes/catalog/handlers.ts`

```typescript
import type { RouteHandler } from '@hono/zod-openapi'
import { getProductsRoute } from '@fullstack-forge/api-spec/routes/catalog'
import { db } from '~/db/client'
import { products } from '~/db/schema/index'

export const getProductsHandler: RouteHandler<typeof getProductsRoute> = async (c) => {
  // 1. Request 파싱 (Zod 자동 검증)
  const query = c.req.valid('query')

  // 2. DB 조회 (Drizzle)
  const rows = await db.select({ ... }).from(products).where(...)

  // 3. 응답 변환 + 반환
  return c.json({ items: rows, total, page, pageSize }, 200)
}
```

### App Bootstrap

**참조**: `apps/api/src/app.ts`

```typescript
import { createApp } from '~/lib/create-app'
import { handleAppError } from '~/lib/errors'
import { catalogIndex } from '~/routes/catalog'

export const app = createApp()
app.use('*', logger())
app.onError(handleAppError)
app.route('/health', healthIndex)
app.route('/auth', authIndex)
app.route('/admin', adminIndex)
app.route('/', catalogIndex)
registerOpenApiDocument(app)
```

새 도메인 route 추가 시 `app.route('/{domain}', {domain}Index)` 한 줄 추가.

### 에러 응답 포맷

```typescript
// 모든 에러 응답은 이 형태
return c.json({ code: 'error_code', error: '사람이 읽을 수 있는 메시지' }, 400)
// HTTP 상태: 400 (validation), 401 (auth), 403 (forbidden), 404 (not found), 409 (conflict), 429 (rate limit)
```

### Auth Middleware

**참조**: `apps/api/src/routes/auth/@shared/http/middleware.ts`

```typescript
import { requireAuth } from '~/routes/auth/@shared/http/middleware'

// Protected route
const protectedRouter = createRouter()
protectedRouter.use('*', requireAuth)  // JWT 검증, authUser 컨텍스트 세팅
```

## 4. DB Schema Pattern (Drizzle)

**참조**: `apps/api/src/db/schema/product.ts`

```typescript
import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  price: integer('price').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
```

### 스키마 등록

**참조**: `apps/api/src/db/schema/index.ts`

모든 스키마를 barrel export. 새 스키마 파일 추가 시 `export * from './{domain}'` 추가.

### Relations

**참조**: `apps/api/src/db/schema/relations.ts`

모든 테이블 관계를 한 파일에서 정의.

### Enum 패턴

```typescript
import { pgEnum } from 'drizzle-orm/pg-core'

export const orderStatusEnum = pgEnum('order_status', [
  'created', 'confirmed', 'preparing', 'ready', 'dispatched', 'delivered', 'cancelled', 'partially_cancelled',
])
```

## 5. Store (고객 앱) Frontend Pattern

### Route 파일

**참조**: `apps/store/src/routes/_catalog/index.tsx`

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '~/screens/home/home-page'

export const Route = createFileRoute('/_catalog/')({
  component: HomePage,
})
```

- 파일 기반 라우팅: `routes/_catalog/index.tsx` → URL `/`
- `routes/_catalog/products.$productId.tsx` → URL `/products/:productId`
- Route 파일은 thin wrapper — 실제 UI는 `screens/` 폴더에서 구현

### Screen 컴포넌트

**참조**: `apps/store/src/screens/home/home-page.tsx`

```typescript
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { catalogListQueryOptions } from '~/lib/queries/catalog'

export const HomePage = () => {
  const [params, setParams] = useState<CatalogListParams>({ page: 1, page_size: 20 })
  const { data, isLoading } = useQuery({ ...catalogListQueryOptions(params), placeholderData: keepPreviousData })

  return (
    <div className="...">
      {/* Tailwind v4 스타일링 */}
    </div>
  )
}
```

### API Client

**참조**: `apps/store/src/lib/api/catalog.ts`

```typescript
import { ApiClientError, fetchWithRefresh } from '~/lib/api/core'

export type CatalogProductSummary = { id: string; name: string; ... }

const requestJson = async <T>(path: string, params?: Record<string, string>): Promise<T> => {
  const url = new URL(path, window.location.origin)
  if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetchWithRefresh(url.toString())
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiClientError(body.code ?? 'unknown', body.error ?? res.statusText)
  }
  return res.json()
}

export const getCatalogProducts = (params: CatalogListParams) =>
  requestJson<CatalogProductListResponse>('/api/products', toQueryParams(params))
```

### Query Options

**참조**: `apps/store/src/lib/queries/catalog.ts`

```typescript
import { queryOptions } from '@tanstack/react-query'

export const catalogQueryKeys = {
  categories: ['catalog', 'categories'] as const,
  list: (params: CatalogListParams) => ['catalog', 'list', params] as const,
  detail: (id: string) => ['catalog', 'detail', id] as const,
}

export const catalogListQueryOptions = (params: CatalogListParams) =>
  queryOptions({
    queryKey: catalogQueryKeys.list(params),
    queryFn: () => getCatalogProducts(params),
    staleTime: 30_000,
  })
```

### Mutation Options (Admin)

**참조**: `apps/admin/src/lib/queries/catalog.ts`

```typescript
export const createProductMutationOptions = () => ({
  mutationFn: createAdminProduct,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: catalogQueryKeys.list._def })
  },
})
```

## 6. Admin (운영 앱) Frontend Pattern

Store와 동일한 패턴이나 다음이 추가됨:

### Mutation API Client

**참조**: `apps/admin/src/lib/api/catalog.ts`

```typescript
const requestMutate = async <T>(method: string, path: string, body?: unknown): Promise<T> => {
  const res = await fetchWithRefresh(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (method === 'DELETE' && res.status === 204) return undefined as T
  if (!res.ok) { /* throw ApiClientError */ }
  return res.json()
}

export const createAdminProduct = (data: CreateProductRequest) =>
  requestMutate<Product>('POST', '/admin/products', data)
```

### FormData (이미지 업로드)

```typescript
export const uploadProductImages = async (productId: string, files: File[]) => {
  const formData = new FormData()
  files.forEach((file) => formData.append('images', file))
  const res = await fetchWithRefresh(`/api/admin/products/${productId}/images`, {
    method: 'POST',
    body: formData,  // Content-Type은 브라우저가 자동 설정
  })
  // ...
}
```

### overlay-kit (다이얼로그)

Admin에서 확인 대화상자, 모달 등은 `overlay-kit` 사용.

## 7. Test Pattern

### Backend Handler Test

**참조**: `apps/api/src/routes/auth/login/handler.test.ts`

```typescript
import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authIndex } from '../index'

// 1. vi.hoisted()로 공유 상태 선언
const { dbState, passwordState } = vi.hoisted(() => ({
  dbState: { selectQueue: [] as unknown[] },
  passwordState: { valid: false },
}))

// 2. vi.mock()으로 의존성 모킹
vi.mock('~/db/client', () => ({
  db: {
    select: vi.fn(() => {
      const builder = {
        from: vi.fn(() => builder),
        innerJoin: vi.fn(() => builder),
        where: vi.fn(() => builder),
        limit: vi.fn(async () => (dbState.selectQueue.shift() ?? []) as unknown[]),
      }
      return builder
    }),
  },
}))

// 3. describe + given/when/then
describe('POST /auth/login', () => {
  let app: Hono

  beforeEach(() => {
    // given — 초기화
    dbState.selectQueue = []
    passwordState.valid = false
    app = new Hono()
    app.route('/auth', authIndex)
  })

  it('returns 200 with valid credentials', async () => {
    // given
    dbState.selectQueue = [[{ id: '...', email: '...' }]]
    passwordState.valid = true

    // when
    const res = await app.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'password123' }),
    })

    // then
    expect(res.status).toBe(200)
  })
})
```

### Frontend Test

**참조**: `apps/store/src/screens/home/home-page.test.tsx`

```typescript
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { renderWithRouter } from '~/test/render-with-router'

// MSW로 API 모킹
const handlers = [
  http.get('/api/products', () => HttpResponse.json({ items: [...], total: 1, page: 1, pageSize: 20 })),
]

describe('HomePage', () => {
  it('renders product list', async () => {
    // given
    const { worker } = renderWithRouter('/', { handlers })

    // when
    const productName = await screen.findByText('Test Product')

    // then
    expect(productName).toBeInTheDocument()
  })
})
```

## 8. 공통 규칙

### 파일 네이밍

- Backend route: `apps/api/src/routes/{domain}/handlers.ts`
- Backend route index: `apps/api/src/routes/{domain}/index.ts`
- Backend shared: `apps/api/src/routes/{domain}/@shared/{concern}.ts`
- API spec route: `packages/api-spec/src/routes/{domain}/{resource}/route.ts`
- API spec schemas: `packages/api-spec/src/{domain}-schemas.ts`
- Store route: `apps/store/src/routes/{path}.tsx`
- Store screen: `apps/store/src/screens/{domain}/{page-name}.tsx`
- Store API client: `apps/store/src/lib/api/{domain}.ts`
- Store queries: `apps/store/src/lib/queries/{domain}.ts`
- Admin: store와 동일 구조

### Export 스타일

```typescript
// ✅ Declaration-time export (프로젝트 컨벤션)
export const myFunction = () => { ... }
export type MyType = { ... }

// ❌ Trailing export block (사용 금지)
const myFunction = () => { ... }
export { myFunction }
```

### Import Alias

- Backend: `~/` → `apps/api/src/`
- Store: `~/` → `apps/store/src/`
- Admin: `~/` → `apps/admin/src/`
- Packages: `@fullstack-forge/api-spec`, `@fullstack-forge/design-system`

### 검증 명령어

```bash
# 개별 프로젝트
pnpm nx run @fullstack-forge/api-spec:codegen    # API spec 변경 시
pnpm nx run @fullstack-forge/api:typecheck
pnpm nx run @fullstack-forge/api:test
pnpm nx run @fullstack-forge/store:typecheck
pnpm nx run @fullstack-forge/store:test
pnpm nx run @fullstack-forge/admin:typecheck
pnpm nx run @fullstack-forge/admin:test

# 전체 워크스페이스
pnpm nx run-many -t typecheck
pnpm nx run-many -t test
pnpm nx run-many -t build
pnpm check                                        # lint + format + typecheck
```

### Design System Components

`@fullstack-forge/design-system`에서 import 가능한 컴포넌트:

Button, Input, Textarea, Select, Label, Badge, Card, Dialog, Sheet, Popover, DropdownMenu, Table, Tabs, Separator, ScrollArea, Avatar, Command, InputGroup, Skeleton, Sonner (toast)

```typescript
import { Button } from '@fullstack-forge/design-system/components/button'
import { Input } from '@fullstack-forge/design-system/components/input'
import { cn } from '@fullstack-forge/design-system/lib/utils'
```
