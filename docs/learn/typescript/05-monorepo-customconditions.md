# 05. 모노레포 전용: customConditions

## 핵심 질문

> `customConditions: ["@fullstack-forge/source"]`는 어떤 원리로 빌드 없는 라이브 타입을 가능하게 하는가?

## 한 줄 답

package.json `exports`에 커스텀 조건을 추가하여, TypeScript와 번들러가 **빌드 결과물 대신 소스 파일을 직접 참조**하게 만든다.

---

## 현재 설정

```jsonc
// tsconfig.base.json
{
  "compilerOptions": {
    "customConditions": ["@fullstack-forge/source"]
  }
}
```

---

## 배경: package.json `exports`와 조건부 해석

Node.js 12+에서 도입된 `exports` 필드는 **조건(condition)에 따라 다른 파일을 제공**한다:

```jsonc
// packages/shared/package.json
{
  "name": "@fullstack-forge/shared",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",     // TypeScript 타입
      "import": "./dist/index.js",       // ESM import 시
      "require": "./dist/index.cjs",     // CJS require 시
      "default": "./dist/index.js"
    }
  }
}
```

Node.js/번들러는 위에서 아래로 조건을 매칭하여 첫 번째 일치하는 경로를 사용한다.

### 문제: 모노레포에서 빌드 의존성

```
apps/store에서 @fullstack-forge/shared를 import
        │
        ├── exports 해석 → ./dist/index.js
        │                   └── 이 파일이 존재하려면?
        │
        └── packages/shared를 먼저 빌드해야 함 💀
```

**결과:**
- 코드 수정할 때마다 의존 패키지를 다시 빌드해야 함
- 빌드 순서 관리가 복잡
- HMR이 패키지 경계를 넘지 못함

---

## 해결: customConditions로 소스 직접 참조

### Step 1: package.json exports에 커스텀 조건 추가

```jsonc
// packages/shared/package.json
{
  "name": "@fullstack-forge/shared",
  "exports": {
    ".": {
      "@fullstack-forge/source": "./src/index.ts",  // ← 소스 직접 참조
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    }
  }
}
```

### Step 2: TypeScript에 조건 알리기

```jsonc
// tsconfig.base.json
{
  "compilerOptions": {
    "customConditions": ["@fullstack-forge/source"]
  }
}
```

TypeScript가 exports를 해석할 때 `@fullstack-forge/source` 조건을 인식하여 `./src/index.ts`를 직접 참조한다.

### Step 3: 런타임(Vite/Vitest)에도 동일 조건 설정

```typescript
// vite.config.ts
export default defineConfig({
  resolve: {
    conditions: ['@fullstack-forge/source'],
  },
});

// vitest.config.ts
export default defineConfig({
  resolve: {
    conditions: ['@fullstack-forge/source'],
  },
});
```

### 결과

```
apps/store에서 @fullstack-forge/shared를 import
        │
        ├── TypeScript: customConditions 매칭
        │   └── → ./src/index.ts (소스 직접 참조) ✅
        │
        ├── Vite: resolve.conditions 매칭
        │   └── → ./src/index.ts (소스 직접 참조) ✅
        │
        └── 빌드 불필요! 🎉
```

---

## 왜 `@fullstack-forge/source`인가? — 조건 이름의 스코프

Colin McDonnell(Zod 저자)의 권고:

> *"If you choose something generic like 'source', you may have dependencies with the same condition defined in their package.json."*

`source` 같은 일반적인 이름을 쓰면, 외부 npm 패키지의 `exports`에 같은 조건이 있을 경우 **의도치 않게 그 패키지의 소스 파일을 참조**하게 된다.

### 실제 사례들

| 프로젝트 | 조건 이름 | 스코프 |
|----------|----------|--------|
| **Grafana** | `@grafana-app/source` | `@grafana-app/` |
| **Zod** | `@zod/source` | `@zod/` |
| **Trigger.dev** | `@triggerdotdev/source` | `@triggerdotdev/` |
| **이 프로젝트** | `@fullstack-forge/source` | `@fullstack-forge/` |

스코프를 붙이면 **우리 워크스페이스 패키지에서만** 조건이 매칭되고, 외부 패키지에는 영향 없다.

---

## 무엇이 달라지는가

### 1. 빌드 없는 라이브 타입

```
packages/shared/src/utils.ts를 수정

┌─ customConditions 없을 때 ─────────────────┐
│  1. packages/shared를 다시 빌드             │
│  2. dist/index.js, dist/index.d.ts 갱신    │
│  3. 그제서야 apps/store에서 변경 반영        │
│  소요: 수 초 ~ 수십 초                       │
└─────────────────────────────────────────────┘

┌─ customConditions 있을 때 ─────────────────┐
│  1. 수정 즉시 apps/store에서 변경 반영      │
│  소요: 즉시 (HMR)                           │
└─────────────────────────────────────────────┘
```

### 2. Go-to-Definition이 소스로

IDE에서 import를 `Ctrl+Click`하면:

| | 이동 대상 |
|---|---|
| customConditions **없음** | `dist/index.d.ts` (컴파일된 선언 파일) |
| customConditions **있음** | `src/index.ts` (원본 소스) ✅ |

### 3. 테스트 시 빌드 불필요

```jsonc
// Nx project.json — Before (customConditions 없음)
{
  "test": {
    "dependsOn": ["^build"]  // ← 의존 패키지 전부 빌드 후 테스트
  }
}

// After (customConditions 있음)
{
  "test": {
    // dependsOn 불필요 — 소스 직접 참조하므로
  }
}
```

---

## 개발 vs 프로덕션 흐름

```
개발 시:
  TypeScript IDE  ──customConditions──→  ./src/index.ts (소스)
  Vite dev server ──resolve.conditions──→ ./src/index.ts (소스)

프로덕션 빌드 시:
  Vite build (conditions 미설정) ──→ ./dist/index.js (빌드 결과물)
  npm publish (조건 매칭 불가)    ──→ ./dist/index.js (빌드 결과물)
```

프로덕션 환경에서는 `@fullstack-forge/source` 조건이 설정되지 않으므로 **자동으로 빌드 결과물을 사용**한다. 개발 편의와 프로덕션 안전성을 모두 확보.

---

## Nx와의 연동

Nx는 워크스페이스 생성 시 이 패턴을 자동으로 구성한다:

1. `tsconfig.base.json`에 `customConditions` 추가
2. 라이브러리 `package.json`의 `exports`에 커스텀 조건 포함
3. Vitest/Vite 설정에 `resolve.conditions` 자동 설정

이를 통해:
- **테스트에서 빌드 의존성 제거** — `dependsOn: ["^build"]` 불필요
- **증분 빌드 최적화** — 변경된 소스만 영향
- **캐시 효율 향상** — 불필요한 빌드 캐시 무효화 감소

---

## 주의사항

### 1. 순환 참조

소스를 직접 참조하므로, 패키지 간 **순환 의존이 있으면 무한 루프**가 발생할 수 있다.
`@softarc/sheriff` (이 프로젝트에서 사용)가 의존성 방향을 강제하여 이를 방지.

### 2. TypeScript와 런타임 조건 일치

TypeScript(`customConditions`)와 런타임(`resolve.conditions`)에 **같은 조건을 설정**해야 한다.
불일치하면 "TypeScript는 타입 OK인데 런타임에서 모듈 못 찾음" 에러 발생.

### 3. exports 조건 순서

`exports`에서 조건은 **위에서 아래로** 매칭된다. 커스텀 조건을 **가장 위에** 놓아야 개발 시 소스 참조가 우선:

```jsonc
{
  "exports": {
    ".": {
      "@fullstack-forge/source": "./src/index.ts",  // ← 1순위 (개발)
      "types": "./dist/index.d.ts",                  // ← 2순위 (TS 프로덕션)
      "import": "./dist/index.js",                   // ← 3순위 (런타임)
      "default": "./dist/index.js"
    }
  }
}
```

---

## 이 프로젝트에서의 적용

| 항목 | 현재 상태 |
|------|----------|
| `customConditions` 설정 | ✅ `tsconfig.base.json`에 `["@fullstack-forge/source"]` |
| 패키지 `exports` 설정 | ⏳ 패키지 생성 시 추가 예정 |
| Vite `resolve.conditions` | ⏳ 앱 설정 시 추가 예정 |
| Vitest `resolve.conditions` | ⏳ 테스트 설정 시 추가 예정 |

현재는 `customConditions`만 선언된 상태. 워크스페이스 패키지가 생기면 `exports`와 `resolve.conditions`가 함께 구성된다.

---

## 2026.02 적절성

✅ **모던 모노레포의 핵심 패턴.** 빌드-프리 개발 경험의 근간.
Grafana, Zod, Trigger.dev, Nx 등에서 채택. 2025년 이후 사실상 모노레포 표준.

---

## 참고 자료

- [Colin McDonnell — Live types in a TypeScript monorepo](https://colinhacks.com/essays/live-types-typescript-monorepo)
- [TypeScript TSConfig — customConditions](https://www.typescriptlang.org/tsconfig/customConditions.html)
- [Nx — Testing Without Building Dependencies](https://nx.dev/docs/technologies/test-tools/vitest/guides/testing-without-building-dependencies)
