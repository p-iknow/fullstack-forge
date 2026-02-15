# 01. Knip — 미사용 코드·의존성 탐지

## 핵심 질문

> 모노레포에서 미사용 의존성, 미사용 export, 죽은 파일을 어떻게 자동으로 잡아내는가?

## 한 줄 답

Knip은 워크스페이스별 **entry/project** 매핑으로 코드 도달성(reachability)을 분석하고, 사용되지 않는 의존성·export·파일을 보고한다.

---

## 현재 설정

```jsonc
// knip.json (루트)
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "ignoreFiles": [".claude/**", "sheriff.config.ts"],
  "ignoreDependencies": [
    "tailwindcss",
    "@tailwindcss/vite",
    "@testing-library/react",
    "@typespec/http",
    "@typespec/openapi3",
    "@typespec/openapi",
    "@fullstack-forge/api-spec",
    "@fullstack-forge/design-system",
    "@suspensive/react",
    "@suspensive/react-query",
    "@hono/node-server",
    "ky",
    "lucide-react",
  ],
  "exclude": ["unresolved", "catalog"],
  "workspaces": {
    ".": { "ignoreDependencies": ["@vitest/coverage-v8", "vitest"] },
    "apps/*": {
      "entry": ["src/router.tsx", "src/routes/**/*.tsx"],
      "project": ["src/**/*.{ts,tsx}"],
      "ignore": ["src/routeTree.gen.ts"],
    },
    "apps/api": {
      "entry": ["src/index.ts"],
      "project": ["src/**/*.ts"],
    },
    "packages/api-spec": {
      "entry": [],
      "project": ["src/**/*.tsp"],
      "ignore": ["generated/**"],
    },
    "packages/design-system": {
      "entry": ["src/components/*.tsx", "src/lib/*.ts", "src/hooks/*.ts"],
      "project": ["src/**/*.{ts,tsx}"],
    },
  },
}
```

---

## `entry`/`project` — 워크스페이스별 도달성 기준

**Problem** — 모노레포는 워크스페이스마다 진입점이 다르다. 프론트엔드 앱은 `router.tsx`에서 시작하고, API 서버는 `index.ts`에서 시작하며, 디자인 시스템은 컴포넌트 파일 하나하나가 진입점이다. Knip이 이 구조를 모르면 "사용되지 않는 파일"로 잘못 보고하거나, 실제 죽은 코드를 놓친다.

**Action** — `workspaces` 설정으로 각 워크스페이스에 맞는 `entry`(진입점)와 `project`(분석 범위)를 선언한다:

```jsonc
// 프론트엔드 앱: TanStack Router의 라우트 파일이 진입점
"apps/*": {
  "entry": ["src/router.tsx", "src/routes/**/*.tsx"],
  "project": ["src/**/*.{ts,tsx}"]
}

// API 서버: 단일 진입점
"apps/api": {
  "entry": ["src/index.ts"],
  "project": ["src/**/*.ts"]
}

// 디자인 시스템: 개별 컴포넌트가 각각 진입점 (barrel file 없음)
"packages/design-system": {
  "entry": ["src/components/*.tsx", "src/lib/*.ts", "src/hooks/*.ts"],
  "project": ["src/**/*.{ts,tsx}"]
}
```

`entry`에서 시작해서 `import`를 따라가며 도달 가능한 코드만 "사용 중"으로 판정한다. `project`에 속하지만 도달 불가능한 파일은 미사용으로 보고된다.

**Result** — 각 워크스페이스의 특성에 맞는 정밀한 도달성 분석이 가능하다. TanStack Router처럼 파일 기반 라우팅을 쓰는 앱은 모든 라우트 파일이 진입점이 되고, 디자인 시스템처럼 barrel-less 구조를 쓰는 패키지는 개별 파일이 진입점이 된다. ✅ 2026.02 기준 Knip v5의 권장 워크스페이스 패턴.

---

## `ignoreDependencies` — 런타임 전용 의존성 처리

**Problem** — Tailwind CSS, Base UI, Hono 서버 어댑터 등은 코드에서 직접 `import`하지 않지만 런타임이나 빌드 시스템에서 필요하다. Knip은 `import` 문만 추적하므로, 이런 의존성을 "미사용"으로 오탐(false positive)한다.

```bash
# Knip이 잘못 보고하는 예
Unused dependencies in packages/design-system:
  tailwindcss
  @base-ui/react
  lucide-react
```

**Action** — `ignoreDependencies`로 Knip의 분석에서 명시적으로 제외한다:

```jsonc
"ignoreDependencies": [
  // Tailwind: CSS에서 @import로 로드, JS import 없음
  "tailwindcss", "@tailwindcss/vite",

  // TypeSpec: .tsp 파일에서 사용, JS에서 import 안 함
  "@typespec/http", "@typespec/openapi3", "@typespec/openapi",

  // 내부 워크스페이스: pnpm workspace protocol로 연결
  "@fullstack-forge/api-spec", "@fullstack-forge/design-system",

  // 런타임 어댑터: 빌드 타임에 번들러가 처리
  "@hono/node-server",

  // UI 라이브러리: CSS/아이콘 등 비표준 참조
  "ky", "lucide-react",
  "@suspensive/react", "@suspensive/react-query"
]
```

각 항목에는 왜 코드에서 직접 `import`되지 않는지 명확한 이유가 있다. 이유 없이 무분별하게 추가하면 Knip의 가치가 사라진다.

**Result** — 오탐이 제거되어 Knip 결과에 나오는 항목은 모두 진짜 미사용 코드다. CI에서 `pnpm knip`을 실패 조건으로 걸 수 있다.

> **Caveat**: 새 패키지를 추가할 때 Knip이 오탐하면, 먼저 "정말 import가 불필요한 의존성인가?"를 확인한 후에만 `ignoreDependencies`에 추가해야 한다. 실제로 미사용인 의존성을 예외 처리하면 Knip의 목적이 무너진다.

---

## `exclude` — pnpm catalog 호환성

**Problem** — pnpm의 `catalog:` 프로토콜은 `pnpm-workspace.yaml`에서 버전을 해석하는데, Knip은 이 프로토콜을 알지 못해 "unresolved dependency" 에러를 발생시킨다. 또한 `catalog:` 자체가 Knip의 버전 파싱 로직과 충돌한다.

```bash
# catalog: 프로토콜로 인한 오류
Unresolved: react (catalog:)
Unresolved: typescript (catalog:)
```

**Action** — `exclude` 필드로 해당 카테고리의 검사를 비활성화한다:

```jsonc
"exclude": ["unresolved", "catalog"]
```

- `"unresolved"`: 해석 불가 import 검사를 건너뜀 (pnpm workspace protocol과 충돌 방지)
- `"catalog"`: pnpm catalog 관련 검사를 건너뜀

**Result** — pnpm catalog을 사용하는 모노레포에서도 Knip이 정상 동작한다. catalog 지원이 Knip에 네이티브로 들어오면 이 exclude를 제거할 수 있다. ✅ 2026.02 기준 pnpm catalog + Knip 조합의 필수 워크어라운드.

---

## `ignore`/`ignoreFiles` — 생성 코드 및 비표준 파일 제외

**Problem** — TanStack Router가 자동 생성하는 `routeTree.gen.ts`와 TypeSpec이 생성하는 `generated/**` 디렉토리는 소스가 아닌 출력물이다. 이 파일들을 분석하면 의미 없는 노이즈만 발생한다. 또한 `.claude/` 디렉토리의 AI 스킬 파일이나 `sheriff.config.ts`는 TypeScript 프로젝트의 일부가 아니다.

**Action** — 두 수준의 제외를 사용한다:

```jsonc
// 루트 레벨: 프로젝트 전체에서 제외
"ignoreFiles": [".claude/**", "sheriff.config.ts"],

// 워크스페이스 레벨: 특정 워크스페이스에서만 제외
"apps/*": {
  "ignore": ["src/routeTree.gen.ts"]  // TanStack Router 자동 생성
},
"packages/api-spec": {
  "ignore": ["generated/**"]  // TypeSpec codegen 출력
}
```

**Result** — 분석 대상이 실제 소스 코드로 한정되어 Knip 결과의 신호 대 잡음 비율(SNR)이 높아진다.

---

## 이 프로젝트에서의 적용

| 결정                                 | 해결하는 문제                              |
| ------------------------------------ | ------------------------------------------ |
| 워크스페이스별 `entry`/`project`     | 앱·패키지마다 다른 진입점 구조를 정밀 분석 |
| `ignoreDependencies` 화이트리스트    | 런타임 전용 의존성의 오탐 제거             |
| `exclude: ["unresolved", "catalog"]` | pnpm catalog 프로토콜 호환성 확보          |
| `ignore`/`ignoreFiles` 분리          | 생성 코드·비표준 파일의 노이즈 차단        |

---

## 다음 문서

[02. Sheriff — 모듈 경계 강제](./02-sheriff-module-boundaries.md) — 모노레포에서 패키지 간 의존 방향을 어떻게 강제하는가?
