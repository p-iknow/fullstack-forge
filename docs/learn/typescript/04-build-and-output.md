# 04. 빌드와 출력 옵션

## 핵심 질문

> `noEmit: true`면 tsc는 뭘 하는가? `skipLibCheck`, `allowJs`, `erasableSyntaxOnly`는 왜 필요한가?

## 한 줄 답

tsc는 **타입 경찰 전용**이고, 실제 빌드는 **Vite/tsdown이 담당**한다. 나머지 옵션은 **모노레포 환경에서의 안전장치**.

---

## 현재 설정

```jsonc
{
  "compilerOptions": {
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "allowJs": true,
    "noEmit": true,
    "erasableSyntaxOnly": true,
  },
}
```

---

## `"noEmit": true` — tsc는 타입 체커 전용

**Problem** — tsc가 빌드까지 담당하면 HMR, CSS/에셋 처리, 번들링을 못 하고, esbuild 대비 느리다. Vite와 tsc가 동시에 빌드하면 이중 출력이 발생한다.

**Action** — `noEmit: true`로 tsc의 출력을 완전 차단. 타입 체크만 수행:

```bash
# tsc = 타입 체크만
pnpm typecheck  # → tsc --noEmit

# Vite/tsdown = 실제 빌드
pnpm build      # → vite build / tsdown
```

**Result** — 번들러 기반 프로젝트의 표준 패턴. tsc를 타입 체커 전용으로 쓰는 것은 2024년 이후 사실상 기본. ✅ 필수.

---

## `"skipLibCheck": true` — .d.ts 체크 건너뛰기

**Problem** — `node_modules`의 수천 개 `.d.ts`를 체크하면 빌드 시간이 대폭 증가하고, 서로 다른 TS 버전으로 생성된 `.d.ts` 간 호환성 문제로 유령 에러가 발생한다:

```
TypeScript 5.9로 빌드한 내 프로젝트
├── @types/react (TS 5.7 기준 .d.ts)
├── drizzle-orm (TS 5.5 기준 .d.ts)
└── 버전 차이로 인한 유령 에러 발생
```

**Action** — `.d.ts` 체크를 건너뛴다. 본인 코드(`.ts`)는 여전히 완전 체크:

```
skipLibCheck: true
├── 내 코드 (.ts) 체크      ← 완전 체크
└── .d.ts 파일 전부 건너뜀  ← 빌드 시간 단축
```

**Result** — 사실상 모든 프로젝트에서 필수. 끄면 빌드 시간만 늘고 실질적 이점 없음. ✅ 필수.

---

## `"forceConsistentCasingInFileNames": true` — 파일명 대소문자 일관성

**Problem** — macOS/Windows(대소문자 비구분)에서는 동작하지만 Linux(CI/프로덕션)에서 파일을 못 찾는, 로컬에서 잡히지 않고 CI에서만 터지는 최악의 버그:

```typescript
// 파일명: UserService.ts
import { foo } from './userService' // macOS: OK, Linux: 파일 못 찾음
```

**Action** — 파일 경로의 대소문자를 OS 무관하게 일관되게 강제:

```typescript
import { foo } from './userService' // ❌ macOS에서도 에러
import { foo } from './UserService' // ✅ 정확한 케이스
```

**Result** — 크로스 플랫폼 프로젝트에서 필수. ✅ 권장.

---

## `"allowJs": true` — JavaScript 파일 포함 허용

**Problem** — `allowJs: false`이면 설정 파일(`postcss.config.js`), 스크립트, 서드파티 생성 `.js` 파일이 타입 체크 대상에서 제외되어 에러를 놓칠 수 있다.

**Action** — `.js`/`.jsx` 파일도 TypeScript 프로젝트에 포함:

```
루트/
├── vite.config.ts      ← .ts 설정
├── postcss.config.js   ← .js 설정 (일부 도구는 .ts 미지원)
└── scripts/seed.js     ← 간단한 스크립트
```

**Result** — 모노레포에서 JS 파일이 섞이기 쉽고, 미래 마이그레이션 유연성도 확보. ✅ 실용적.

---

## `"erasableSyntaxOnly": true` — 지울 수 있는 TS 구문만 허용

**Problem** — `enum`, `namespace`, 파라미터 프로퍼티 등 TypeScript 전용 구문은 "타입만 지우면 유효한 JS"가 안 되므로, Node.js 네이티브 타입 스트리핑(`--experimental-strip-types`)이나 esbuild/SWC 같은 경량 트랜스파일러에서 정확히 처리할 수 없다:

```typescript
enum Direction {
  Up,
  Down,
}
// → 타입만 지우면? Direction은 undefined

class User {
  constructor(private name: string) {}
}
// → 타입만 지우면? this.name 할당이 사라짐
```

**Action** — TS 5.8+의 `erasableSyntaxOnly`로 이런 구문을 금지하고 모던 대체 패턴을 강제:

```typescript
// enum 대신
const Direction = { Up: 0, Down: 1 } as const

// 파라미터 프로퍼티 대신
class User {
  name: string
  constructor(name: string) {
    this.name = name
  }
}
```

**Result** — Node.js 네이티브 TS 실행 호환, 번들러 친화적, 모던 패턴 강제. 프로젝트 초기에 켜야 마이그레이션 비용 없음. ✅ 권장.

> **Caveat**: `enum`을 전면 금지하므로 기존에 enum을 많이 쓰는 코드베이스에서는 마이그레이션이 필요하다. 이 프로젝트는 greenfield이므로 처음부터 적용.

---

## 이 프로젝트에서의 적용

| 옵션                               | 해결하는 문제                                        |
| ---------------------------------- | ---------------------------------------------------- |
| `noEmit`                           | tsc/번들러 이중 빌드 방지. tsc는 타입 체커 전용      |
| `skipLibCheck`                     | `.d.ts` 체크로 인한 빌드 속도 저하 및 유령 에러 방지 |
| `forceConsistentCasingInFileNames` | macOS→Linux 간 파일명 대소문자 불일치 방지           |
| `allowJs`                          | 설정 파일, 스크립트 등 JS 파일 누락 방지             |
| `erasableSyntaxOnly`               | 지울 수 없는 TS 구문 금지. 번들러/Node.js 호환       |

---

## 다음 문서

[05. 모노레포 전용: customConditions](./05-monorepo-customconditions.md) — 빌드 없이 라이브 타입이 되는 원리
