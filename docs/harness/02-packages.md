# 02. Packages — 공유 라이브러리 계층

`packages/` 아래의 공유 라이브러리 3개: `shared`, `api-spec`, `base-ui`.

## packages/shared

범용 유틸. 런타임에 무관한 순수 로직만.

### package.json

```jsonc
{
  "name": "@fullstack-forge/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts",
    },
  },
  "scripts": {
    "typecheck": "tsc -b",
    "test": "vitest run --passWithNoTests",
  },
  "devDependencies": {
    "typescript": "catalog:",
    "vitest": "catalog:",
  },
}
```

### tsconfig.json

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "include": ["src/**/*.ts"],
  "compilerOptions": {
    "composite": true,
    "noEmit": false,
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist",
    "rootDir": "src",
  },
}
```

> base의 `lib: ["ES2022"]`를 그대로 사용. DOM, jsx 추가 없음.

---

## packages/api-spec — ★ TypeSpec 기반 API 명세

**TypeSpec → OpenAPI 3.1 → TypeScript 타입** 파이프라인. API 계약의 단일 진실 원천(SSOT).

### 설계 결정

| 항목           | 결정                                                                                      | 근거                                                                          |
| -------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 명세 도구      | TypeSpec (`.tsp`)                                                                         | OpenAPI보다 간결, 제네릭/유니온 지원, 이식성 (Kotlin/Go)                      |
| 생성 대상      | OpenAPI 3.1 YAML + TS 타입                                                                | `openapi.yaml`은 git commit (언어 무관 계약), `types.ts`는 gitignore (재생성) |
| TS 타입 생성   | `openapi-typescript`                                                                      | OpenAPI → TS 타입, `paths`/`components` 인터페이스 생성                       |
| codegen 트리거 | `pnpm --filter @fullstack-forge/api-spec codegen` 또는 `pnpm exec nx run-many -t codegen` | `build`, `typecheck` 전에 자동 실행 (`dependsOn`)                             |

### package.json

```jsonc
{
  "name": "@fullstack-forge/api-spec",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./types": {
      "types": "./generated/types.ts",
      "default": "./generated/types.ts",
    },
    "./openapi": "./generated/openapi.yaml",
  },
  "scripts": {
    "codegen": "tsp compile src/main.tsp --emit @typespec/openapi3 && openapi-typescript generated/openapi.yaml -o generated/types.ts",
    "codegen:check": "tsp compile src/main.tsp --no-emit",
    "typecheck": "tsp compile src/main.tsp --no-emit",
  },
  "devDependencies": {
    "@typespec/compiler": "catalog:",
    "@typespec/http": "catalog:",
    "@typespec/openapi3": "catalog:",
    "@typespec/openapi": "catalog:",
    "openapi-typescript": "catalog:",
  },
}
```

> `typecheck`는 TypeSpec 컴파일러로 `.tsp` 문법 검증. TS `tsc`는 사용하지 않음 (`.ts` 소스 없음).

### tspconfig.yaml

```yaml
emit:
  - '@typespec/openapi3'
options:
  '@typespec/openapi3':
    output-file: openapi.yaml
    emitter-output-dir: '{project-root}/generated'
```

### Fresh clone 필수 절차

```bash
pnpm install
pnpm --filter @fullstack-forge/api-spec codegen
```

위 두 단계가 끝나기 전에는 `@fullstack-forge/api-spec/types` import가 깨질 수 있다.

상세 기준(자동 실행 규칙, stale 대응, CI 동작)은 [05-integration](./05-integration.md)의 `Codegen 워크플로`를 단일 기준으로 따른다.

### Generated 파일 정책 (필수 규칙)

| 파일                                       | 정책           | 이유                                         |
| ------------------------------------------ | -------------- | -------------------------------------------- |
| `packages/api-spec/generated/openapi.yaml` | **git commit** | 언어 무관 계약(SSOT), 리뷰 가능한 변경 이력  |
| `packages/api-spec/generated/types.ts`     | **gitignore**  | `openapi.yaml`에서 재생성 가능한 파생 산출물 |

원칙: 계약 파일은 commit, 언어별 파생 파일은 regenerate.

### Codegen 장애 대응

- `types.ts` 누락/IDE 오류, stale 타입, CI openapi mismatch 대응은 [05-integration](./05-integration.md)의 `Stale generated 대응`을 사용한다.
- 실행 체크리스트는 [execution/00-workspace-baseline](../execution/00-workspace-baseline.md)을 사용한다.

### src/main.tsp — 엔트리 포인트

```typespec
import "@typespec/http";
import "@typespec/openapi";

using TypeSpec.Http;

@service({
  title: "Repo API",
})
namespace RepoApi;

// --- Models ---

model HealthResponse {
  status: "ok" | "error";
}

model User {
  id: string;
  email: string;
  name: string;
}

model ErrorResponse {
  @statusCode statusCode: 500;
  error: string;
}

// --- Routes ---

@route("/health")
namespace Health {
  @get op check(): HealthResponse;
}
```

> API가 커지면 `src/models/`, `src/routes/` 디렉토리로 분리하고 `import`로 연결.

### 리뷰/문의 계약 확장 예시

PRD에서 추가된 리뷰/댓글/고객문의는 TypeSpec에서 아래처럼 확장한다.

```typespec
model ReviewCreateRequest {
  orderItemId: string;
  productId: string;
  rating: int32;
  content: string;
}

model ReviewCommentCreateRequest {
  content: string;
}

model Review {
  id: string;
  orderItemId: string;
  productId: string;
  rating: int32;
  content: string;
}

model ReviewComment {
  id: string;
  reviewId: string;
  content: string;
}

model InquiryCreateRequest {
  category: "order" | "payment" | "delivery" | "product" | "account" | "other";
  subject: string;
  content: string;
}

model InquiryReplyCreateRequest {
  content: string;
}

model Inquiry {
  id: string;
  category: "order" | "payment" | "delivery" | "product" | "account" | "other";
  subject: string;
  content: string;
  status: "open" | "in_progress" | "resolved" | "closed";
}

model InquiryReply {
  id: string;
  inquiryId: string;
  content: string;
}

@route("/reviews")
namespace Reviews {
  @post op create(@body body: ReviewCreateRequest): Review;

  @post
  @route("/{reviewId}/comments")
  op createComment(
    @path reviewId: string,
    @body body: ReviewCommentCreateRequest,
  ): ReviewComment;
}

@route("/inquiries")
namespace Inquiries {
  @post op create(@body body: InquiryCreateRequest): Inquiry;
  @get @route("/{id}") op get(@path id: string): Inquiry;
  @post @route("/{id}/replies")
  op reply(@path id: string, @body body: InquiryReplyCreateRequest): InquiryReply;
}
```

### generated/ 디렉토리

```
generated/
├── openapi.yaml    # ✅ git commit — 언어 무관 API 계약
└── types.ts        # ❌ gitignore — codegen 출력물 (openapi-typescript)
```

`openapi.yaml` 예시 (tsp compile 출력):

```yaml
openapi: 3.1.0
info:
  title: Repo API
  version: 0.0.0
paths:
  /health:
    get:
      operationId: Health_check
      responses:
        '200':
          description: Successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthResponse'
components:
  schemas:
    HealthResponse:
      type: object
      required: [status]
      properties:
        status:
          type: string
          enum: [ok, error]
```

리뷰/문의 path 예시:

```yaml
paths:
  /reviews:
    post:
      operationId: Reviews_create
  /reviews/{reviewId}/comments:
    post:
      operationId: Reviews_createComment
  /inquiries:
    post:
      operationId: Inquiries_create
  /inquiries/{id}:
    get:
      operationId: Inquiries_get
  /inquiries/{id}/replies:
    post:
      operationId: Inquiries_reply
```

`types.ts` 예시 (openapi-typescript 출력):

```ts
// auto-generated by openapi-typescript — DO NOT EDIT

export interface paths {
  '/health': {
    get: {
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['HealthResponse']
          }
        }
      }
    }
  }
}

export interface components {
  schemas: {
    HealthResponse: {
      status: 'ok' | 'error'
    }
    User: {
      id: string
      email: string
      name: string
    }
  }
}
```

### 디렉토리 구조

```
packages/api-spec/
├── src/
│   └── main.tsp              # TypeSpec 엔트리
├── generated/
│   ├── openapi.yaml           # git committed
│   └── types.ts               # gitignored (재생성)
├── tspconfig.yaml
└── package.json
```

### 소비 패턴

```ts
// 프론트엔드 — ky + TanStack Query + Suspensive
import type { paths } from '@fullstack-forge/api-spec/types'
import ky from 'ky'
import { queryOptions } from '@tanstack/react-query'

const api = ky.create({ prefixUrl: '/api' })

type MeResponse = paths['/auth/me']['get']['responses']['200']['content']['application/json']
type ReviewCreateBody = paths['/reviews']['post']['requestBody']['content']['application/json']
type InquiryDetail =
  paths['/inquiries/{id}']['get']['responses']['200']['content']['application/json']

const meQueryOptions = queryOptions({
  queryKey: ['auth', 'me'],
  queryFn: () => api.get('auth/me').json<MeResponse>(),
})

const createReview = (body: ReviewCreateBody) => api.post('reviews', { json: body }).json()

const inquiryDetailQuery = (id: string) => api.get(`inquiries/${id}`).json<InquiryDetail>()

// 백엔드 — 타입 계약 준수
import type { components } from '@fullstack-forge/api-spec/types'
type HealthResponse = components['schemas']['HealthResponse']
```

---

## packages/base-ui

Base UI + shadcn 컴포넌트 라이브러리. Tailwind v4 + CVA 패턴.

### package.json

```jsonc
{
  "name": "@fullstack-forge/base-ui",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./components/*": {
      "@fullstack-forge/source": "./src/components/*.tsx",
      "types": "./dist/components/*.d.ts",
      "default": "./dist/components/*.js",
    },
    "./lib/*": {
      "@fullstack-forge/source": "./src/lib/*.ts",
      "types": "./dist/lib/*.d.ts",
      "default": "./dist/lib/*.js",
    },
    "./hooks/*": {
      "@fullstack-forge/source": "./src/hooks/*.ts",
      "types": "./dist/hooks/*.d.ts",
      "default": "./dist/hooks/*.js",
    },
    "./styles/*.css": "./src/styles/*.css",
  },
  "scripts": {
    "build": "tsdown",
    "typecheck": "tsc -b",
    "test": "vitest run --passWithNoTests",
  },
  "dependencies": {
    "@base-ui/react": "^1.2.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.511.0",
    "tailwind-merge": "^3.3.0",
  },
  "peerDependencies": {
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
  },
  "devDependencies": {
    "@tailwindcss/vite": "catalog:",
    "@testing-library/jest-dom": "catalog:",
    "@testing-library/react": "catalog:",
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "jsdom": "catalog:",
    "tailwindcss": "catalog:",
    "tsdown": "catalog:",
    "tw-animate-css": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:",
  },
}
```

> 추가 컴포넌트별 deps (cmdk, vaul, sonner, embla-carousel-react 등)는 필요에 따라 추가.

### tsconfig.json

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "compilerOptions": {
    "composite": true,
    "noEmit": false,
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] },

    // ★ 프론트 런타임 선언 (base에 없으므로 여기서 추가)
    "jsx": "react-jsx",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
  },
}
```

### tsconfig.build.json

```jsonc
{
  "extends": "./tsconfig.json",
  "exclude": [
    "src/**/*.test.*",
    "src/**/*.spec.*",
    "src/**/*.figma.*",
    "vitest.config.ts",
    "vitest.setup.ts",
  ],
}
```

### components.json (shadcn CLI)

```jsonc
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-vega",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/globals.css",
    "baseColor": "zinc",
    "cssVariables": true,
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "hooks": "@/hooks",
    "lib": "@/lib",
    "ui": "@/components",
    "utils": "@/lib/utils",
  },
}
```

### 컴포넌트 패턴 예시

```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

```tsx
// src/components/button.tsx
import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium ...',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        outline: 'border-border bg-background hover:bg-muted ...',
        // ...
      },
      size: {
        default: 'h-9 gap-1.5 px-2.5',
        sm: 'h-8 gap-1 px-2.5',
        // ...
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
```

### 디렉토리 구조

```
packages/base-ui/
├── src/
│   ├── components/          # shadcn 컴포넌트 (50+)
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── hooks/
│   │   └── use-mobile.ts
│   ├── lib/
│   │   └── utils.ts         # cn() 유틸
│   └── styles/
│       └── globals.css       # Tailwind + CSS 변수 + 테마
├── components.json
├── figma.config.json
├── tsconfig.json
├── tsconfig.build.json
├── vitest.config.ts
└── vitest.setup.ts
```
