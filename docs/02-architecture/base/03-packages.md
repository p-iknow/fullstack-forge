# 02. Packages — 공유 라이브러리 계층

`packages/` 아래의 공유 라이브러리 3개: `shared`, `api-spec`, `design-system`.

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

## packages/api-spec — ★ zod-openapi 산출물 패키지

`apps/api`의 `@hono/zod-openapi` 라우트 스키마에서 OpenAPI/TS 타입을 생성해 소비하는 패키지.

### 설계 결정

| 항목           | 결정                                                                                      | 근거                                                |
| -------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 계약 기준      | Hono route-level schema (`@hono/zod-openapi`)                                             | 구현/검증/문서 기준을 한곳에 결합                   |
| 생성 대상      | OpenAPI 3.1 YAML + TS 타입                                                                | `openapi.yaml`은 git commit, `types.ts`는 gitignore |
| TS 타입 생성   | `openapi-typescript`                                                                      | OpenAPI -> TS 타입(`paths`/`components`)            |
| codegen 트리거 | `pnpm --filter @fullstack-forge/api-spec codegen` 또는 `pnpm exec nx run-many -t codegen` | `build`, `typecheck` 전에 자동 실행(`dependsOn`)    |

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
    "codegen": "bun ../../scripts/extract-openapi.ts && openapi-typescript generated/openapi.yaml -o generated/types.ts",
  },
  "devDependencies": {
    "openapi-typescript": "catalog:",
  },
}
```

> `scripts/extract-openapi.ts`는 Hono 앱을 직접 import해 `/openapi.json` 엔드포인트를 호출하고, 결과를 `packages/api-spec/generated/openapi.yaml`로 저장하는 빌드 스크립트다. 실제 서버 기동 없이 동작한다.

### Fresh clone 필수 절차

```bash
pnpm install
pnpm --filter @fullstack-forge/api-spec codegen
```

위 두 단계가 끝나기 전에는 `@fullstack-forge/api-spec/types` import가 깨질 수 있다.

### Generated 파일 정책 (필수 규칙)

| 파일                                       | 정책           | 이유                                         |
| ------------------------------------------ | -------------- | -------------------------------------------- |
| `packages/api-spec/generated/openapi.yaml` | **git commit** | 언어 무관 계약, 리뷰 가능한 변경 이력        |
| `packages/api-spec/generated/types.ts`     | **gitignore**  | `openapi.yaml`에서 재생성 가능한 파생 산출물 |

### 디렉토리 구조

```
packages/api-spec/
├── generated/
│   ├── openapi.yaml           # git committed
│   └── types.ts               # gitignored (재생성)
└── package.json
```

### 소비 패턴

```ts
import type { paths } from '@fullstack-forge/api-spec/types'
import ky from 'ky'

const api = ky.create({ prefixUrl: '/api' })

type MeResponse = paths['/auth/me']['get']['responses']['200']['content']['application/json']

export const getMe = () => api.get('auth/me').json<MeResponse>()
```

---

## packages/design-system

shadcn/ui 디자인 시스템. Base UI (`@base-ui/react`) 프리미티브 기반, Tailwind v4 + CVA 패턴.

### package.json

```jsonc
{
  "name": "@fullstack-forge/design-system",
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
packages/design-system/
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
