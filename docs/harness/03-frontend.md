# 03. Frontend — apps/ 계층

퀵커머스 주문-배송 앱의 프론트엔드 계층.
앱 경로와 역할은 아래처럼 고정한다.

- `store`: 고객용
- `admin`: 운영자용

## 구현 목표 (앱 관점)

- Stage 0: 인증 화면/세션 상태(`auth/me`) 연동
- Stage 0.5: 로그인 옵션 3종(Email/Google/Kakao) + OAuth callback 처리
- Stage 1: 주문 생성/조회 화면 (`POST /orders`, `GET /orders/:id`)
- Stage 1.5: 리뷰/문의 화면 (`POST /reviews`, `POST /reviews/:id/comments`, `POST /inquiries`)
- Stage 2: admin 문의 답변/상태 전이 + 리뷰 모더레이션 화면
- Stage 4: 주문 상태 read model(캐시 기반 상태 반영) UI

## 앱 경계 (커머스 기준)

- `store`: 인증, 주문 생성/조회, 리뷰 작성/댓글, 문의 생성/조회, 내 주문 상태
- `admin`: 주문 상태 전이, 배차/재고/알림, 리뷰 모더레이션, 문의 응답/상태 전이 화면
- 공통 UI/유틸: `packages/base-ui`, `packages/shared`
- 공통 계약 타입: `packages/api-spec`

두 앱은 같은 API를 호출하지만 권한/화면/업무 플로우가 다르다.

## package.json

```jsonc
{
  "name": "@fullstack-forge/store",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "sideEffects": false,
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "start": "node .output/server/index.mjs",
    "typecheck": "tsc --noEmit",
    "test": "vitest run --passWithNoTests",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  },
  "dependencies": {
    "@fullstack-forge/api-spec": "workspace:*",
    "@fullstack-forge/base-ui": "workspace:*",
    "@fullstack-forge/shared": "workspace:*",
    "@tanstack/react-router": "catalog:",
    "@tanstack/react-query": "catalog:",
    "@tanstack/react-router-devtools": "catalog:",
    "@tanstack/react-start": "catalog:",
    "@suspensive/react": "catalog:",
    "@suspensive/react-query": "catalog:",
    "ky": "catalog:",
    "react": "catalog:",
    "react-dom": "catalog:"
  },
  "devDependencies": {
    "@storybook/addon-a11y": "catalog:",
    "@storybook/react-vite": "catalog:",
    "@tailwindcss/vite": "catalog:",
    "@testing-library/jest-dom": "catalog:",
    "@testing-library/react": "catalog:",
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "@vitejs/plugin-react": "catalog:",
    "jsdom": "catalog:",
    "storybook": "catalog:",
    "tailwindcss": "catalog:",
    "typescript": "catalog:",
    "vite": "catalog:",
    "vite-tsconfig-paths": "catalog:",
    "vitest": "catalog:"
  }
}
```

> 프론트 API 계층은 `ky`(HTTP) + `@tanstack/react-query`(캐시/동기화) + `@suspensive/react-query`(Suspense 유틸) 조합. → [05-integration](./05-integration.md) 참조.

## tsconfig.json

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "include": ["**/*.ts", "**/*.tsx"],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "~/*": ["./src/*"] },

    // ★ 프론트 런타임 (base에 없으므로 앱에서 선언)
    "jsx": "react-jsx",
    "lib": ["DOM", "DOM.Iterable", "ES2022"]
  },
  "references": [
    { "path": "../../packages/base-ui" },
    { "path": "../../packages/shared" }
  ]
}
```

## vite.config.ts

```ts
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    conditions: ['@fullstack-forge/source'],
  },
  plugins: [tailwindcss(), tsConfigPaths(), tanstackStart(), viteReact()],
})
```

> admin은 `port: 3002`, `storybook: 6007`으로 변경.

권장 스크립트 별칭(선택):

- `pnpm --filter @fullstack-forge/store dev` = store dev
- `pnpm --filter @fullstack-forge/admin dev` = admin dev

## vitest.config.ts

```ts
import { defineProject } from 'vitest/config'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineProject({
  plugins: [tsConfigPaths()],
  resolve: {
    conditions: ['@fullstack-forge/source'],  // ★ base-ui 소스 레벨 해석
  },
  test: {
    name: 'store',
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    css: true,
  },
})
```

## 디렉토리 구조

```
apps/store/
├── src/
│   ├── lib/
│   │   ├── api-client.ts        # ky 인스턴스 + typed fetcher
│   │   └── query-client.ts      # TanStack QueryClient
│   ├── queries/
│   │   └── auth.ts              # auth query options / suspense hooks
│   ├── router.tsx              # TanStack Router 생성
│   ├── routes/
│   │   ├── __root.tsx          # HTML shell, CSS import
│   │   └── index.tsx           # 홈 페이지
│   ├── screens/                # 페이지 컴포넌트
│   └── styles/
│       └── app.css             # @import tailwindcss + base-ui globals
├── .storybook/
│   ├── main.ts
│   ├── preview.ts
│   └── storybook.css
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── vitest.setup.ts
```

## 핵심 소스 파일

### src/styles/app.css

```css
@import 'tailwindcss';
@import '@fullstack-forge/base-ui/styles/globals.css';
```

### src/router.tsx

```ts
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
  })
  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
```

### src/lib/query-client.ts

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
    },
  },
})
```

### src/routes/__root.tsx

```tsx
import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { Outlet, createRootRoute, HeadContent, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ErrorBoundary, Suspense } from '@suspensive/react'
import { queryClient } from '~/lib/query-client'
import appCss from '~/styles/app.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'App A' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary fallback={({ error }) => <p>{error.message}</p>}>
            <Suspense fallback={<p>Loading...</p>}>{children}</Suspense>
          </ErrorBoundary>
        </QueryClientProvider>
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  )
}
```

## Storybook 설정

### .storybook/main.ts

```ts
import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  async viteFinal(config) {
    const { mergeConfig } = await import('vite')
    const { default: tailwindcss } = await import('@tailwindcss/vite')
    const { default: tsConfigPaths } = await import('vite-tsconfig-paths')

    return mergeConfig(config, {
      plugins: [tailwindcss(), tsConfigPaths()],
    })
  },
}

export default config
```
