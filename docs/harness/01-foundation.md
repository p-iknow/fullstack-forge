# 01. Foundation — 루트 설정 파일

`fullstack-forge` 루트에 위치하는 모든 설정 파일.

## tsconfig.base.json — ★ 핵심

**런타임 중립.** DOM, jsx, Node 타입 없음. 각 프로젝트가 자기 런타임을 extends 후 추가.

```jsonc
{
  "compilerOptions": {
    // --- 타입 안전 ---
    "strict": true,
    "noUnusedLocals": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,

    // --- 모듈 ---
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "target": "ES2022",
    "lib": ["ES2022"], // ★ DOM 없음
    "isolatedModules": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "verbatimModuleSyntax": true, // import type 강제

    // --- 빌드 ---
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "allowJs": true,
    "noEmit": true,

    // --- 모노레포 ---
    "customConditions": ["@fullstack-forge/source"],
  },
}
```

**각 프로젝트에서 추가할 내용:**

| 프로젝트 타입         | 추가 설정                                                        | 이유                 |
| --------------------- | ---------------------------------------------------------------- | -------------------- |
| 프론트 앱/UI 패키지   | `"jsx": "react-jsx"`, `"lib": ["DOM", "DOM.Iterable", "ES2022"]` | React + 브라우저 API |
| 백엔드 서비스         | `"types": ["node"]`                                              | Node.js API          |
| 순수 타입/유틸 패키지 | 추가 없음                                                        | base 그대로 사용     |

## tsconfig.json (solution-style)

```jsonc
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {},
  "files": [],
  "references": [
    { "path": "apps/store" },
    { "path": "apps/admin" },
    { "path": "packages/base-ui" },
    { "path": "packages/shared" },
    { "path": "apps/api" },
  ],
}
```

커머스 역할 매핑:

- `apps/store` = store
- `apps/admin` = admin

이벤트 시나리오 확장 시 `apps/workers/*`를 `references`와 workspace에 추가한다.

## pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'

catalog:
  # --- React / Frontend ---
  '@tanstack/react-router': ^1.159.10
  '@tanstack/react-router-devtools': ^1.159.10
  '@tanstack/react-start': ^1.159.13
  react: ^19.2.4
  react-dom: ^19.2.4
  '@tailwindcss/vite': ^4.1.18
  '@types/react': ^19.0.8
  '@types/react-dom': ^19.0.3
  '@vitejs/plugin-react': ^4.6.0
  tailwindcss: ^4.1.18
  vite: ^7.3.1
  vite-tsconfig-paths: ^5.1.4

  # --- Backend ---
  hono: ^4.11.9
  '@hono/node-server': ^1.19.9
  drizzle-orm: ^0.45.1
  drizzle-kit: ^0.31.9
  pg: ^8.16.3
  '@types/pg': ^8.15.5
  redis: ^5.8.2
  prom-client: ^15.1.3
  tsx: ^4.21.0
  tsup: ^8.5.1
  '@types/node': ^24.10.13

  # --- API Spec (TypeSpec → OpenAPI → TS) ---
  '@typespec/compiler': ^1.9.0
  '@typespec/http': ^1.9.0
  '@typespec/openapi3': ^1.9.0
  '@typespec/openapi': ^1.9.0
  openapi-typescript: ^7.6.1
  ky: ^1.14.3
  '@tanstack/react-query': ^5
  '@suspensive/react': ^3
  '@suspensive/react-query': ^3

  # --- Shared Tooling ---
  typescript: ~5.9.3
  vitest: ^4.0.18
  '@vitest/coverage-v8': ^4.0.18
  '@testing-library/jest-dom': ^6.9.1
  '@testing-library/react': ^16.3.2
  jsdom: ^27.4.0
  tsc-alias: ^1.8.15

  # --- Storybook ---
  storybook: ^10.2.8
  '@storybook/addon-a11y': ^10.2.8
  '@storybook/react-vite': ^10.2.8

  # --- UI ---
  tw-animate-css: ^1.2.9
```

## nx.json

```jsonc
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": [
      "default",
      "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?",
      "!{projectRoot}/tsconfig.spec.json",
    ],
    "sharedGlobals": [
      "{workspaceRoot}/.github/workflows/ci.yml",
      "{workspaceRoot}/pnpm-workspace.yaml",
    ],
  },
  "targetDefaults": {
    "codegen": { "dependsOn": ["^codegen"], "cache": true },
    "build": { "dependsOn": ["codegen", "^build"], "cache": true },
    "dev": { "cache": false },
    "typecheck": { "dependsOn": ["codegen", "^typecheck"], "cache": true },
    "lint": { "cache": true },
    "test": { "cache": true },
    "storybook": { "cache": false },
    "build-storybook": { "cache": true },
  },
}
```

## package.json (루트)

```jsonc
{
  "name": "@fullstack-forge/source",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "lint": "oxlint -c .oxlintrc.json",
    "lint:fix": "oxlint -c .oxlintrc.json --fix",
    "format": "oxfmt -c .oxfmtrc.json",
    "format:check": "oxfmt -c .oxfmtrc.json --check",
    "build": "nx run-many -t build",
    "dev": "nx run-many -t dev",
    "typecheck": "nx run-many -t typecheck",
    "test": "nx run-many -t test",
    "sheriff": "sheriff verify",
    "knip": "knip",
    "check": "pnpm lint && pnpm format:check && pnpm typecheck && pnpm sheriff && pnpm knip",
  },
  "devDependencies": {
    "@softarc/sheriff-core": "^0.19.6",
    "@vitest/coverage-v8": "catalog:",
    "knip": "^5.82.1",
    "nx": "22.5.1",
    "oxfmt": "^0.27.0",
    "oxlint": "^1.42.0",
    "typescript": "catalog:",
    "vitest": "catalog:",
  },
  "pnpm": {
    "onlyBuiltDependencies": ["esbuild", "nx"],
  },
}
```

## .npmrc

```ini
hoist-pattern[]=storybook
hoist-pattern[]=@storybook/*
shamefully-hoist=false
strict-peer-dependencies=false
auto-install-peers=true
```

## .oxlintrc.json

```jsonc
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["typescript", "react", "unicorn", "import"],
  "categories": {
    "correctness": "error",
    "suspicious": "warn",
    "pedantic": "off",
  },
  "rules": {
    "no-console": "warn",
    "eqeqeq": "error",
    "react/react-in-jsx-scope": "off",
  },
  "env": { "browser": true, "node": true, "es6": true },
  "ignorePatterns": [
    "node_modules",
    "dist",
    ".output",
    "*.gen.ts",
    "routeTree.gen.ts",
    "**/generated/**",
  ],
}
```

## .oxfmtrc.json

```jsonc
{
  "$schema": "./node_modules/oxfmt/configuration_schema.json",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "bracketSpacing": true,
  "arrowParens": "always",
  "ignorePatterns": [
    "node_modules",
    "dist",
    ".output",
    "pnpm-lock.yaml",
    "*.gen.ts",
    "routeTree.gen.ts",
    "**/generated/**",
  ],
}
```

## .gitignore

```gitignore
# Dependencies
node_modules

# Build outputs
dist
.output
tmp
*.tsbuildinfo
storybook-static

# TanStack Start
routeTree.gen.ts
.tanstack
.vinxi
.nitro

# TypeSpec generated (openapi-typescript output — regenerated from spec)
packages/api-spec/generated/types.ts

# Nx
.nx/cache
.nx/workspace-data

# Environment & secrets
.env
.env.*
!.env.example

# Logs
pnpm-debug.log*
npm-debug.log*
*.log

# Coverage & testing
/coverage
*.lcov

# OS
.DS_Store
Thumbs.db

# IDEs
/.idea
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
```

> `dist`가 글로벌 패턴이므로 `apps/*/dist`도 자동 무시됨.
>
> `packages/api-spec/generated/openapi.yaml`은 **git commit** — 언어 무관 계약 파일. `types.ts`만 gitignore (codegen 출력물).
