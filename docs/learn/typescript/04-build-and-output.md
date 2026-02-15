# 04. 빌드와 출력 옵션

## 핵심 질문

> `noEmit: true`면 tsc는 뭘 하는가? `skipLibCheck`, `forceConsistentCasingInFileNames`, `allowJs`는 왜 필요한가?

## 한 줄 답

tsc는 **타입 경찰 전용**이고, 실제 빌드는 **Vite/tsdown이 담당**한다. 나머지 옵션은 **모노레포 환경에서의 안전장치**.

---

## 현재 설정

```jsonc
{
  "compilerOptions": {
    "skipLibCheck": true,                    // .d.ts 체크 건너뛰기
    "forceConsistentCasingInFileNames": true, // 파일명 대소문자 일관성 강제
    "allowJs": true,                          // JS 파일 포함 허용
    "noEmit": true,                           // 출력 파일 생성 안 함
    "erasableSyntaxOnly": true                // 지울 수 있는 TS 구문만 허용
  }
}
```

---

## `"noEmit": true` — tsc는 타입 체커 전용

TypeScript 컴파일러가 **어떤 출력 파일도 생성하지 않는다**. 타입 체크만 수행.

### 이 프로젝트의 빌드 파이프라인

```
┌─────────────────────────────────────────────┐
│                 타입 체크                     │
│  tsc --noEmit                               │
│  → 타입 에러만 검사, 파일 생성 없음           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│                실제 빌드                      │
│  Vite (esbuild) → 프론트엔드 번들            │
│  tsdown          → 패키지 라이브러리 빌드      │
│  → .js, .d.ts, sourcemap 생성               │
└─────────────────────────────────────────────┘
```

```bash
# tsc = 타입 체크만
pnpm typecheck  # → nx run-many -t typecheck → tsc --noEmit

# vite/tsdown = 실제 빌드
pnpm build      # → nx run-many -t build → vite build / tsdown
```

### 왜 tsc로 빌드하지 않는가?

| | tsc | Vite(esbuild) / tsdown |
|---|---|---|
| **속도** | 느림 (전체 프로그램 분석) | 빠름 (파일별 트랜스파일) |
| **HMR** | 미지원 | 지원 |
| **번들링** | 미지원 | 지원 |
| **CSS/에셋** | 미지원 | 지원 |
| **타입 체크** | ✅ 정밀 | ❌ 없음 (esbuild는 타입 무시) |

**결론:** tsc의 장점은 타입 체크뿐. 빌드는 번들러가 더 빠르고 기능이 풍부하다.

### `noEmit`이 영향을 미치는 옵션들

`noEmit: true`이면 다음 옵션들은 **타입 체크 시 해석 방식**에만 영향을 미친다:
- `target` → 다운레벨 변환 없음, `lib` 타입 선택에만 영향
- `module` → 실제 모듈 변환 없음, import/export 해석에만 영향
- `jsx` → JSX 변환 없음, JSX 타입 체크에만 영향

### 2026.02 적절성

✅ 번들러 기반 프로젝트의 표준 패턴. tsc를 타입 체커 전용으로 쓰는 것은 2024년 이후 사실상 기본.

---

## `"skipLibCheck": true` — .d.ts 체크 건너뛰기

`node_modules` 안의 `.d.ts` (선언 파일) 타입 체크를 건너뛴다.

### 체감 효과

```
skipLibCheck: false
├── 내 코드 (.ts) 체크         ← 필요 ✅
├── react의 .d.ts 체크         ← 불필요
├── hono의 .d.ts 체크          ← 불필요
├── drizzle-orm의 .d.ts 체크   ← 불필요
└── 수천 개 .d.ts 파일 체크    ← 시간 낭비 ❌

skipLibCheck: true
├── 내 코드 (.ts) 체크         ← 여전히 완전 체크 ✅
└── .d.ts 파일 전부 건너뜀     ← 빌드 시간 대폭 단축 ✅
```

### 왜 안전한가?

- `.d.ts` 파일은 라이브러리 작성자가 **이미 검증한 타입 정의**
- 서로 다른 TypeScript 버전으로 생성된 `.d.ts` 간 **호환성 문제** 방지
- 본인 코드의 `.ts` 파일은 여전히 **완전 체크**됨

### 끄면 어떻게 되는가?

```
TypeScript 5.9로 빌드한 내 프로젝트
├── @types/react (TS 5.7 기준 .d.ts)
├── drizzle-orm (TS 5.5 기준 .d.ts)
└── 버전 차이로 인한 유령 에러 발생 💥
```

### 2026.02 적절성

✅ 사실상 모든 프로젝트에서 필수. 끄면 빌드 시간만 늘고 실질적 이점 없음.

---

## `"forceConsistentCasingInFileNames": true` — 파일명 대소문자 일관성

파일 경로의 대소문자를 **OS 무관하게 일관되게** 강제한다.

### 문제 상황

```typescript
// 파일명: UserService.ts

// macOS/Windows (대소문자 비구분 파일 시스템)
import { foo } from "./userService"; // ← 동작함 ✅ ... 이지만

// Linux (대소문자 구분 파일 시스템) — CI/프로덕션 서버
import { foo } from "./userService"; // ← 파일 못 찾음 ❌ 💥
```

### 이 옵션을 켜면

```typescript
import { foo } from "./userService"; // ← macOS에서도 에러 ✅
// Error: Already included file name 'UserService.ts' differs from
// file name 'userService.ts' only in casing.

import { foo } from "./UserService"; // ← 정확한 케이스 ✅
```

### 왜 중요한가

- 개발은 macOS/Windows에서 하고 CI/프로덕션은 Linux인 팀이 대부분
- 대소문자 불일치는 **로컬에서 잡히지 않고 CI에서만 터지는** 최악의 버그 유형
- 이 옵션으로 개발 환경에서 미리 잡을 수 있음

### 2026.02 적절성

✅ 크로스 플랫폼 프로젝트에서 필수. TypeScript 5.x에서 기본값이 `true`가 아닌 것이 아쉬울 정도.

---

## `"allowJs": true` — JavaScript 파일 포함 허용

TypeScript 프로젝트에서 `.js`/`.jsx` 파일도 포함할 수 있게 한다.

### 이 프로젝트에서 필요한 이유

```
루트/
├── vite.config.ts        ← .ts 설정
├── vitest.config.ts      ← .ts 설정
├── postcss.config.js     ← .js 설정 (일부 도구는 .ts 미지원)
├── scripts/
│   └── seed.js           ← 간단한 스크립트
└── *.config.mjs          ← ESM 설정 파일
```

- 설정 파일 (`vite.config.js`, `postcss.config.js` 등)이 `.js`일 수 있음
- 서드파티 도구가 생성하는 `.js` 파일 처리
- 점진적 마이그레이션 지원 (JS → TS)

### `allowJs: false`이면?

```
src/
├── utils.ts        ← 포함 ✅
├── legacy.js       ← 무시 ❌ (타입 체크 대상에서 제외)
└── config.js       ← 무시 ❌
```

### 2026.02 적절성

✅ 실용적 설정. 모노레포에서는 JS 파일이 섞이기 쉽고, 미래 마이그레이션 유연성도 확보.

---

## 옵션 간 관계 — 빌드 파이프라인 관점

```
소스 코드 (.ts, .tsx, .js)
         │
         ├──→ tsc (타입 체크 전용)
         │    ├── noEmit: true            → 출력 없음
         │    ├── skipLibCheck: true       → .d.ts 건너뜀 (속도)
         │    ├── allowJs: true           → .js도 체크 대상
         │    ├── forceConsistent...      → 파일명 대소문자 강제
         │    └── erasableSyntaxOnly: true → 지울 수 없는 TS 구문 금지
         │
         └──→ Vite / tsdown (실제 빌드)
              ├── .js 번들 생성
              ├── .d.ts 생성 (tsdown)
              └── sourcemap 생성
```

---

## 이 프로젝트에서의 적용

| 옵션 | 역할 |
|------|------|
| `noEmit` | tsc를 타입 경찰 전용으로 제한. 빌드는 Vite/tsdown |
| `skipLibCheck` | `node_modules` .d.ts 체크 생략으로 빌드 속도 확보 |
| `forceConsistentCasingInFileNames` | macOS 개발 → Linux CI 간 파일명 불일치 방지 |
| `allowJs` | 설정 파일, 스크립트 등 JS 파일 포함 허용 |
| `erasableSyntaxOnly` | 지울 수 없는 TS 구문 금지. Node.js 네이티브 타입 스트리핑 호환 |

---

## `"erasableSyntaxOnly": true` — 지울 수 있는 TS 구문만 허용 (TS 5.8+)

TypeScript 전용 구문 중 **런타임에 영향을 주는(= 타입만 지워서는 유효한 JS가 안 되는)** 구문을 금지한다.

### 배경: Node.js 네이티브 타입 스트리핑

Node.js 22+에서 `--experimental-strip-types` 플래그가 도입되었다.
이 모드는 `.ts` 파일에서 **타입 어노테이션만 지우고** 나머지를 그대로 JS로 실행한다.

```typescript
// 타입 어노테이션만 지우면 유효한 JS가 됨 ✅
function greet(name: string): string {
  return `Hello, ${name}`;
}
// → function greet(name) { return `Hello, ${name}`; }
```

하지만 일부 TypeScript 구문은 **타입만 지워서는 유효한 JS가 되지 않는다:**

```typescript
// enum — 값을 생성하는 TS 전용 구문
enum Direction { Up, Down, Left, Right }
// → 타입만 지우면? Direction은 undefined 💥

// namespace — 객체를 생성하는 TS 전용 구문
namespace Utils { export function helper() {} }
// → 타입만 지우면? Utils는 undefined 💥

// 파라미터 프로퍼티 — 클래스 필드를 암묵적으로 생성
class User {
  constructor(private name: string) {}
}
// → 타입만 지우면? this.name 할당이 사라짐 💥
```

### 금지되는 구문

| 구문 | 예시 | 대체 |
|------|------|------|
| `enum` | `enum Color { Red, Green }` | `const Color = { Red: 0, Green: 1 } as const` |
| `const enum` | `const enum Dir { Up }` | 일반 객체 + `as const` |
| `namespace` | `namespace Utils { ... }` | ES 모듈 (`export function ...`) |
| 파라미터 프로퍼티 | `constructor(private x: number)` | 명시적 필드 선언 + 할당 |
| `import =` | `import x = require("y")` | `import x from "y"` |
| `export =` | `export = value` | `export default value` |

### 허용되는 구문 (타입만 지우면 유효한 JS)

```typescript
// 타입 어노테이션 — 지우면 유효한 JS ✅
const name: string = "hello";
function add(a: number, b: number): number { return a + b; }

// 인터페이스/타입 — 통째로 지우면 됨 ✅
interface User { name: string; }
type ID = string | number;

// 제네릭 — 지우면 유효한 JS ✅
function first<T>(arr: T[]): T { return arr[0]; }

// import type — 통째로 지우면 됨 ✅
import type { Config } from "./config";
```

### 왜 프로젝트 초기에 켜는가

1. **미래 호환성** — Node.js 네이티브 TS 실행이 안정화되면 바로 활용 가능
2. **더 나은 코드 스타일** — `enum` 대신 `as const`, `namespace` 대신 ES 모듈 등 모던 패턴 강제
3. **번들러 친화적** — esbuild, SWC 등 파일별 트랜스파일러와 완벽 호환
4. **나중에 켜면 기존 코드 수정 필요** — 프로젝트 초기에 켜야 마이그레이션 비용 없음

### 2026.02 적절성

✅ 이 프로젝트(TS ~5.9.3)에서 사용 가능. 프로젝트 초기에 켜두면 후회할 일이 적다.

---

## 다음 문서

[05. 모노레포 전용: customConditions](./05-monorepo-customconditions.md) — 빌드 없이 라이브 타입이 되는 원리
