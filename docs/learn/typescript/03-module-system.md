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
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "target": "ES2022",
    "lib": ["ES2022"],
    "types": [],
    "isolatedModules": true,
    "moduleDetection": "force",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "verbatimModuleSyntax": true,
  },
}
```

---

## `"module": "ESNext"` — 출력 모듈 형태

**Problem** — `module`을 잘못 선택하면 TypeScript가 import/export를 CJS(`require`)로 변환하거나, Node.js ESM 규칙(확장자 필수)을 강제하여 번들러 환경에서 불필요한 제약이 생긴다.

**Action** — 번들러(Vite/esbuild)가 모듈 처리를 담당하므로 `"ESNext"` 선택. `tsc`가 직접 Node.js용으로 빌드할 때만 `"NodeNext"` 사용:

```
번들러가 트랜스파일 → module: "ESNext" + moduleResolution: "Bundler"
tsc가 트랜스파일   → module: "NodeNext" + moduleResolution: "NodeNext"
```

**Result** — Vite + tsdown 기반 프로젝트에 정확한 선택. ✅ 번들러 기반 프로젝트의 사실상 표준.

---

## `"moduleResolution": "Bundler"` — import 경로 해석 전략

**Problem** — `"NodeNext"`는 상대 import에 확장자를 강제(`./Button.js`)하여 번들러 환경에서 불필요한 마찰이 생긴다:

```typescript
// moduleResolution: "NodeNext"
import { Button } from './Button' // ❌ 확장자 필요
import { Button } from './Button.js' // ✅ (소스는 .tsx지만 .js로 써야 함)
```

**Action** — `"Bundler"`(TS 5.0+)는 `package.json` `exports`/`imports` 해석 + 확장자 생략 허용을 결합:

```typescript
// moduleResolution: "Bundler"
import { Button } from './Button' // ✅ 번들러가 알아서 해석
```

**Result** — `exports` 필드를 활용하면서도 확장자 생략이 가능. ✅ 번들러 환경에 최적.

---

## `"target": "ES2022"` — JavaScript 다운레벨 타겟

**Problem** — `target`이 너무 낮으면 불필요한 폴리필 코드가 생성되고, 너무 높으면 구형 브라우저에서 동작하지 않는다.

**Action** — ES2022 선택. top-level `await`, `Array.at()`, `Error.cause`, private fields 등 사용 가능. `noEmit: true`이므로 실제 다운레벨 변환은 Vite가 담당하고, `target`은 주로 `lib` 타입 정의에 영향:

```typescript
// ES2022에서 사용 가능
const last = [1, 2, 3].at(-1) // Array.at()
const err = new Error('msg', { cause }) // Error.cause
class Foo {
  #secret = 42
} // private fields
```

**Result** — 브라우저 호환성 고려 시 보수적이면서 모던한 균형점. ✅ 적절.

> **Caveat**: Node 22+ 전용이면 `ES2023`/`ES2024`로 올려 `Object.groupBy`, `Promise.withResolvers` 등을 쓸 수 있다. 이 프로젝트는 프론트엔드(브라우저)도 포함하므로 보수적 유지도 합리적.

---

## `"lib": ["ES2022"]` — 전역 타입 정의 세트

**Problem** — `lib`에 `"DOM"`을 넣으면 백엔드 패키지에서 `document`, `window` 같은 브라우저 API가 타입 에러 없이 사용 가능해져 런타임 에러로 이어진다:

```typescript
// packages/api/src/service.ts (백엔드)
const el = document.getElementById('foo') // lib에 "DOM" 있으면 에러 안 남
```

**Action** — 루트 base에서는 `"DOM"`을 빼고, 프론트엔드 패키지에서만 개별 추가:

```jsonc
// apps/store/tsconfig.json
{ "compilerOptions": { "lib": ["ES2022", "DOM", "DOM.Iterable"] } }
```

**Result** — 백엔드에 브라우저 API 유입 차단. 런타임별 타입 분리. ✅ 모노레포에서 중요한 위생 조치.

---

## `"types": []` — @types 자동 포함 차단

**Problem** — 기본값이면 `node_modules/@types/` 안의 모든 패키지가 전역에 포함되어, 프론트엔드 패키지에서 `process`, `Buffer` 같은 Node 전역 타입이 보인다(타입 오염):

```typescript
// packages/shared/src/utils.ts (순수 유틸리티)
const buf = Buffer.from('hello') // @types/node가 전역에 있으면 에러 안 남
```

**Action** — 빈 배열로 자동 포함을 차단하고, 필요한 패키지에서만 명시적으로 추가:

```jsonc
// apps/api/tsconfig.json (백엔드)
{ "compilerOptions": { "types": ["node"] } }
```

**Result** — 패키지 간 타입 오염 방지. ✅ 모노레포에서 필수.

---

## `"isolatedModules": true` — 파일별 독립 트랜스파일 강제

**Problem** — `const enum`, 타입-only re-export 등 크로스-파일 정보가 필요한 구문은 esbuild/SWC 같은 파일별 트랜스파일러에서 동작하지 않는다:

```typescript
// const enum — 다른 파일의 값을 인라인해야 함
const enum Direction {
  Up,
  Down,
}

// 타입-only re-export — 런타임에 존재하지 않음
export { SomeType } from './types'
```

**Action** — `isolatedModules: true`로 파일별 독립 트랜스파일이 불가능한 구문을 금지:

```typescript
export type { SomeType } from './types' // type 명시 필요
```

**Result** — 번들러(Vite/esbuild) 환경에서 안전한 코드 보장. ✅ 권장.

> **Caveat**: `verbatimModuleSyntax: true`가 `isolatedModules` 동작을 내포하므로 기술적으로 중복. TS 5.0.4에서 함께 사용해도 에러 안 남. 명시적 의도 표현용으로 유지하거나 제거해도 무방.

---

## `"moduleDetection": "force"` — 모든 파일을 모듈로 취급

**Problem** — 기본(`"auto"`)이면 `import`/`export`가 없는 파일을 스크립트(전역 스코프)로 간주하여 의도치 않은 전역 오염이 발생한다:

```typescript
// config.ts — import/export 없음
const API_URL = 'http://localhost:3000'
// "auto": 전역 스코프 → 다른 파일에서 import 없이 접근 가능
```

**Action** — `"force"`로 모든 파일을 무조건 모듈로 취급:

```typescript
// "force": 독립 모듈 스코프 → export 없으면 외부 접근 불가
const API_URL = 'http://localhost:3000'
```

**Result** — n8n, MUI, Sanity 등 광범위 사용. ✅ 모던 프로젝트의 사실상 표준.

---

## `"esModuleInterop": true` — CJS/ESM 상호운용

**Problem** — CJS로 출판된 npm 패키지를 ESM `default import`로 가져올 수 없다:

```typescript
// esModuleInterop: false
import * as express from 'express' // namespace import만 가능
```

**Action** — `__importDefault` 헬퍼로 CJS `module.exports`를 ESM default export처럼 동작하게 한다:

```typescript
// esModuleInterop: true
import express from 'express' // default import 가능
```

**Result** — 대부분의 npm 패키지가 아직 CJS이므로 여전히 필요. ✅ 권장.

> **Caveat**: `noEmit: true`와 함께 쓰면 헬퍼가 실제로 생성되진 않지만, 타입 체크 시 default import 허용이라는 역할은 수행한다. `verbatimModuleSyntax`와 충돌하지 않음 — 서로 다른 문제를 해결.

---

## `"resolveJsonModule": true` — JSON import 허용

**Problem** — `.json` 파일을 import하면 모듈로 인식하지 못해 에러가 발생한다.

**Action** — JSON import를 허용하고 타입 추론을 자동 제공:

```typescript
import packageJson from './package.json'
console.log(packageJson.version) // 타입: string
```

**Result** — 설정 파일, 로케일 데이터 등 JSON import는 흔한 패턴. ✅ 권장.

---

## `"verbatimModuleSyntax": true` — import/export 있는 그대로 출력

**Problem** — TypeScript가 "타입-only import인지 값 import인지" 추론하여 자동 제거(elision)하면, 번들러가 타입 import를 런타임 코드로 남기거나, 코드만 보고 import 성격을 판별할 수 없다:

```typescript
import { UserType } from './types' // 타입인가 값인가? 코드만 봐서는 모름
```

**Action** — 타입 import에 `type` 키워드를 명시적으로 강제. TS 5.0에서 `importsNotUsedAsValues`와 `preserveValueImports`를 통합 대체:

```typescript
import type { UserType } from './types' // 타입만
import { type UserConfig, createUser } from './users' // 혼합
```

**Result** — 번들러 안전, 가독성 향상, tree-shaking 효율. ✅ 모던 TypeScript 사실상 필수.

---

## 이 프로젝트에서의 적용

| 옵션                          | 해결하는 문제                                          |
| ----------------------------- | ------------------------------------------------------ |
| `module: "ESNext"`            | 번들러 환경에서 불필요한 CJS 변환/ESM 확장자 강제 방지 |
| `moduleResolution: "Bundler"` | `exports` 지원 + 확장자 생략 허용                      |
| `target: "ES2022"` / `lib`    | 모던 기능 타입 지원 + 브라우저 호환 균형               |
| `types: []`                   | 패키지 간 전역 타입 오염 차단                          |
| `isolatedModules`             | 번들러 파일별 트랜스파일 호환 보장                     |
| `moduleDetection: "force"`    | 스크립트/모듈 혼동으로 인한 전역 오염 방지             |
| `esModuleInterop`             | CJS 패키지의 default import 허용                       |
| `verbatimModuleSyntax`        | 타입/값 import 구분을 명시적으로 강제                  |

---

## 다음 문서

[04. 빌드와 출력 옵션](./04-build-and-output.md) — `noEmit`이면 tsc는 뭘 하는가?
