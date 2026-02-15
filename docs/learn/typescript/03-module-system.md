# 03. 모듈 시스템 옵션

## 핵심 질문

> `module`, `moduleResolution`, `target`, `verbatimModuleSyntax` 등 모듈 관련 옵션이 많은데, 각각 무슨 역할이고 어떻게 연결되는가?

## 한 줄 답

**"TypeScript는 뭘 출력하고, import를 어떻게 찾고, 어떤 JavaScript를 가정하는가"** — 이 세 질문에 각각 대응하는 옵션이다.

---

## 현재 설정

```jsonc
{
  "compilerOptions": {
    "module": "ESNext",              // 출력 모듈 형태
    "moduleResolution": "Bundler",   // import 경로 해석 전략
    "target": "ES2022",             // JS 다운레벨 타겟
    "lib": ["ES2022"],              // 전역 타입 정의 세트
    "types": [],                    // @types 자동 포함 차단
    "isolatedModules": true,        // 파일별 독립 트랜스파일 강제
    "moduleDetection": "force",     // 모든 파일을 모듈로 취급
    "esModuleInterop": true,        // CJS→ESM 상호운용
    "resolveJsonModule": true,      // JSON import 허용
    "verbatimModuleSyntax": true    // import/export 있는 그대로 출력
  }
}
```

---

## `"module": "ESNext"` — 출력 모듈 형태

TypeScript가 출력(또는 해석)할 **모듈 시스템 형태**를 결정한다.

| 값 | 용도 | 대표 환경 |
|---|---|---|
| `"ESNext"` | 최신 ESM, 번들러가 처리 | Vite, esbuild, Webpack |
| `"NodeNext"` | Node.js ESM 규칙 적용 | `tsc`로 직접 빌드 → Node.js |
| `"Node18"` (TS 5.8+) | Node 18 고정 환경 | Node 18 LTS 유지 프로젝트 |
| `"CommonJS"` | CJS 출력 | 레거시 Node.js |

### 이 프로젝트에서 `"ESNext"`인 이유

Matt Pocock(Total TypeScript)의 가이드라인:

> *번들러가 트랜스파일 → `module: "ESNext"` + `moduleResolution: "Bundler"`*
> *tsc가 트랜스파일 → `module: "NodeNext"` + `moduleResolution: "NodeNext"`*

이 프로젝트는 **Vite(TanStack Start) + tsdown**이 실제 트랜스파일을 담당하고,
`tsc`는 타입 체크 전용(`noEmit: true`)이므로 `"ESNext"`가 정확하다.

### 2026.02 적절성

✅ 번들러 기반 프로젝트의 사실상 표준.

---

## `"moduleResolution": "Bundler"` — import 경로 해석 전략

`import { foo } from "./bar"` 같은 경로를 **어떤 규칙으로 실제 파일에 매핑**하는가.

| 값 | 특징 | 확장자 생략 | `exports` 지원 |
|---|---|---|---|
| `"Bundler"` (TS 5.0+) | 번들러 동작 모방 | ✅ 허용 | ✅ |
| `"NodeNext"` | Node.js ESM 규칙 | ❌ 필수 | ✅ |
| `"Node10"` (구 `"Node"`) | CJS 전용 | ✅ 허용 | ❌ |

### `"Bundler"`가 해결하는 문제

```typescript
// moduleResolution: "NodeNext"
import { Button } from "./Button";     // ❌ 확장자 필요
import { Button } from "./Button.js";  // ✅ (소스는 .tsx지만 .js로 써야 함)

// moduleResolution: "Bundler"
import { Button } from "./Button";     // ✅ 번들러가 알아서 해석
```

`"Bundler"`는 `"NodeNext"`의 `exports`/`imports` 해석 기능 + 번들러의 확장자 생략 편의를 결합한 것이다.

### 2026.02 적절성

✅ `package.json` `exports` 필드를 활용하면서도 확장자 생략이 필요한 번들러 환경에 최적.

---

## `"target": "ES2022"` — JavaScript 다운레벨 타겟

TypeScript가 **다운레벨 컴파일할 최소 JavaScript 버전**을 지정한다.

### ES2022에서 사용 가능한 주요 기능

| 기능 | 예시 |
|------|------|
| Top-level `await` | `const data = await fetch(...)` (모듈 최상위) |
| `Array.at()` | `[1,2,3].at(-1)` → `3` |
| `Object.hasOwn()` | `Object.hasOwn(obj, 'key')` |
| `Error.cause` | `new Error("msg", { cause: originalError })` |
| 클래스 private fields | `class Foo { #secret = 42; }` |
| `structuredClone()` | 깊은 복사 |

### 더 높은 target은?

TypeScript Node Target Mapping에 따른 권장:

| Node 버전 | 권장 target/lib |
|-----------|-----------------|
| Node 18-20 | ES2023 |
| Node 22 | ES2023 |
| Node 24 | ES2024 |

**이 프로젝트가 ES2022를 선택한 이유:**
- **프론트엔드(브라우저)도 포함** — 브라우저 호환성 고려 시 보수적 선택이 안전
- `noEmit: true`이므로 `target`은 실제 코드 생성에 영향 없음 — 주로 `lib`에 포함될 타입 정의에 영향
- Vite가 추가 다운레벨링 담당

### 2026.02 적절성

⚠️ **적절하지만 올려도 된다.** `Object.groupBy`, `Promise.withResolvers` 등 ES2024 기능을 쓸 계획이면 `ES2023` 또는 `ES2024`로 올릴 수 있다. 단, 브라우저 타겟이 있으므로 보수적 유지도 합리적.

---

## `"lib": ["ES2022"]` — 전역 타입 정의 세트

TypeScript가 인식할 **전역 API 타입**을 결정한다. `target`과 독립적으로 설정 가능.

### 왜 `"DOM"`이 빠져있는가?

**루트 base 설정**이므로 백엔드 패키지에 `DOM` 타입이 유입되면 안 된다:

```typescript
// 만약 lib에 "DOM"이 포함되면...
// packages/api/src/service.ts (백엔드)
const el = document.getElementById("foo"); // ← 컴파일 에러 없음 😱
// 백엔드에서 DOM API를 쓰는 실수를 잡지 못함
```

프론트엔드 패키지에서 **개별적으로** 추가:

```jsonc
// apps/store/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  }
}
```

### 2026.02 적절성

✅ **올바른 설계.** 모노레포에서 런타임별 타입 분리는 중요한 위생 조치. `target`을 올리면 `lib`도 함께 올려야 한다.

---

## `"types": []` — @types 자동 포함 차단

기본값(`types` 미설정)이면 `node_modules/@types/` 안의 **모든** 패키지가 전역에 포함된다.
빈 배열은 **아무것도 자동 포함하지 않음**을 의미한다.

### 왜 필요한가 — 타입 오염 방지

```
node_modules/
├── @types/node/      ← process, Buffer, __dirname 등 전역 타입
├── @types/react/     ← JSX 네임스페이스
└── @types/express/   ← Request, Response 등
```

`types` 미설정 시 위 타입이 **모든 패키지에 전역 노출**:

```typescript
// packages/shared/src/utils.ts (순수 유틸리티 패키지)
const buf = Buffer.from("hello"); // ← Node 타입이 보임 (오염!)
```

`types: []`로 차단 후, 필요한 패키지에서만 명시적으로 추가:

```jsonc
// apps/api/tsconfig.json (백엔드)
{ "compilerOptions": { "types": ["node"] } }

// apps/store/tsconfig.json (프론트엔드)
{ "compilerOptions": { "types": [] } } // Node 타입 불필요
```

### 2026.02 적절성

✅ 모노레포에서 특히 중요한 위생 설정.

---

## `"isolatedModules": true` — 파일별 독립 트랜스파일 강제

각 파일을 **독립적으로 트랜스파일 가능**하도록 강제한다.

### 금지되는 패턴

```typescript
// ❌ const enum — 다른 파일의 값을 인라인해야 하므로 크로스-파일 정보 필요
const enum Direction { Up, Down, Left, Right }

// ❌ 타입-only re-export — 런타임에 존재하지 않는 것을 export
export { SomeType } from "./types";
// → 수정: export type { SomeType } from "./types";
```

### 왜 필요한가

Vite, esbuild, SWC 등의 번들러는 파일을 **하나씩 개별 트랜스파일**한다.
`tsc`처럼 전체 프로그램을 보지 않으므로, 크로스-파일 정보가 필요한 구문은 동작하지 않는다.

### `verbatimModuleSyntax`와의 중복

`verbatimModuleSyntax: true`는 `isolatedModules`의 동작을 **내포(imply)** 한다.
둘 다 켜는 것은 기술적으로 중복이지만:

- TS 5.0.4에서 **함께 사용해도 에러가 나지 않도록** 수정됨 ([GitHub #53601](https://github.com/microsoft/TypeScript/issues/53601))
- `isolatedModules`를 명시하면 **"이 프로젝트는 파일별 트랜스파일 환경"** 이라는 의도가 더 명확
- 일부 도구(Next.js 등)가 `isolatedModules: true`를 명시적으로 요구

### 2026.02 적절성

✅ 중복이지만 해롭지 않고 의도를 명확히 한다. `verbatimModuleSyntax`만으로 충분하므로 제거해도 무방.

---

## `"moduleDetection": "force"` — 모든 파일을 모듈로 취급

TypeScript는 기본적으로 `import`/`export`가 없는 파일을 **스크립트(전역 스코프)** 로 간주한다.

### 문제 상황

```typescript
// config.ts — import/export 없음
const API_URL = "http://localhost:3000";

// TypeScript: "이건 스크립트야" → 전역 스코프에 API_URL이 노출
// 다른 파일에서 import 없이 API_URL 접근 가능 (의도치 않은 전역 오염)
```

### `"force"` 적용 후

```typescript
// config.ts — import/export 없어도 모듈로 취급
const API_URL = "http://localhost:3000";
// → 독립 모듈 스코프. 다른 파일에서 접근 불가 (export 필요)
```

### 왜 `"auto"`가 아니라 `"force"`인가

| 값 | 동작 |
|---|---|
| `"auto"` (기본) | import/export 있으면 모듈, 없으면 스크립트 |
| `"force"` | 항상 모듈 |
| `"legacy"` | TS 4.6 이전 동작 |

`"auto"`는 빈 파일이나 설정 파일이 스크립트로 해석되어 이상한 타입 에러를 일으킬 수 있다.
`"force"`가 현대 프로젝트에서 더 예측 가능하다.

### 2026.02 적절성

✅ n8n, MUI, Sanity 등 메이저 프로젝트에서 광범위하게 사용. 모던 프로젝트의 사실상 표준.

---

## `"esModuleInterop": true` — CJS/ESM 상호운용

CommonJS 모듈을 ESM 스타일로 import할 수 있게 한다.

### 핵심 차이

```typescript
// esModuleInterop: false
import * as express from "express";   // namespace import만 가능

// esModuleInterop: true
import express from "express";        // default import 가능 ✅
```

내부적으로 `__importDefault`/`__importStar` 헬퍼를 삽입하여 CJS의 `module.exports`를 ESM default export처럼 동작하게 만든다.

### `noEmit: true`와 함께 쓸 때

`noEmit`이면 헬퍼가 실제로 생성되지 않지만, **타입 체크 시 default import를 허용**하는 역할은 여전히 수행한다.

### `verbatimModuleSyntax`와 충돌하는가?

**충돌하지 않는다.** 두 옵션은 **다른 문제를 해결**한다:

| 옵션 | 해결하는 문제 |
|------|-------------|
| `esModuleInterop` | CJS/ESM **상호 운용성** (런타임 호환) |
| `verbatimModuleSyntax` | import 문의 **출력 형태 제어** (elision 방지) |

### 2026.02 적절성

✅ 대부분의 npm 패키지가 아직 CJS로 출판되므로 여전히 필요.

---

## `"resolveJsonModule": true` — JSON import 허용

`.json` 파일을 import하고 타입 추론을 받을 수 있다.

```typescript
import packageJson from "./package.json";

console.log(packageJson.version); // 타입: string
console.log(packageJson.name);    // 타입: string
// 모든 필드에 대한 타입 추론 자동 제공
```

### 2026.02 적절성

✅ 설정 파일, 로케일 데이터 등 JSON import는 흔한 패턴.

---

## `"verbatimModuleSyntax": true` — import/export 있는 그대로 출력

**이 그룹에서 가장 중요한 모던 옵션.** TS 5.0에서 도입.

이전 옵션인 `importsNotUsedAsValues`와 `preserveValueImports`를 **통합 대체**했다.

### 무엇을 강제하는가

```typescript
// ❌ 에러: 타입-only import를 값처럼 쓰면 안 됨
import { UserType } from "./types";
// Error: 'UserType' is a type and must be imported using a type-only import

// ✅ 명시적 type import 필요
import type { UserType } from "./types";
// 또는
import { type UserType, createUser } from "./types";
//       ^^^^ type modifier로 타입임을 표시
```

### 왜 중요한가

**1. 번들러 안전:**
번들러가 타입-only import를 런타임 코드로 남기면 에러 발생.
`import type`으로 명시하면 안전하게 제거 가능.

**2. 가독성:**
코드만 보고 "이 import는 타입인가 값인가?" 즉시 판별 가능:

```typescript
import type { User, Order } from "./models";        // 타입만 (런타임에 사라짐)
import { createUser, type UserConfig } from "./users"; // createUser는 값, UserConfig는 타입
```

**3. Tree-shaking 효율:**
번들러가 타입 import를 확실히 제거할 수 있으므로 번들 크기 최적화.

### 2026.02 적절성

✅ 모던 TypeScript 프로젝트의 사실상 필수. Matt Pocock 등 커뮤니티 전반에서 강력 권장.

---

## 옵션 간 관계 정리

```
"이 파일은 무엇인가?"
  └─ moduleDetection: "force"     → 모든 파일을 모듈로 취급

"import 경로를 어떻게 찾는가?"
  └─ moduleResolution: "Bundler"  → package.json exports + 확장자 생략

"출력 모듈 형태는?"
  └─ module: "ESNext"             → ESM 그대로 출력 (번들러가 처리)

"어떤 JavaScript를 가정하는가?"
  ├─ target: "ES2022"            → 다운레벨 기준
  └─ lib: ["ES2022"]             → 사용 가능한 전역 API 타입

"import/export를 어떻게 처리하는가?"
  ├─ verbatimModuleSyntax: true  → 있는 그대로 출력, type 명시 강제
  ├─ esModuleInterop: true       → CJS default import 허용
  ├─ resolveJsonModule: true     → JSON import 허용
  └─ isolatedModules: true       → 파일별 독립 트랜스파일 보장

"전역 타입을 어떻게 관리하는가?"
  └─ types: []                   → @types 자동 포함 차단
```

---

## 다음 문서

[04. 빌드와 출력 옵션](./04-build-and-output.md) — `noEmit`이면 tsc는 뭘 하는가?
