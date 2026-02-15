# 02. Sheriff — 모듈 경계 강제

## 핵심 질문

> 모노레포에서 패키지 간 의존 방향을 어떻게 강제하는가?

## 한 줄 답

Sheriff는 모듈에 **태그**를 부여하고 **depRules**로 허용되는 의존 방향만 선언하여, 위반하는 import를 빌드 타임에 차단한다.

---

## 현재 설정

```ts
// sheriff.config.ts
import { noDependencies, sameTag, type SheriffConfig } from '@softarc/sheriff-core'

export const config: SheriffConfig = {
  enableBarrelLess: true,

  entryPoints: {
    store: './apps/store/src/router.tsx',
    admin: './apps/admin/src/router.tsx',
    api: './apps/api/src/index.ts',
  },

  modules: {
    'apps/store/src/screens': 'app:store',
    'apps/store/src/routes': 'app:store',
    'apps/admin/src/screens': 'app:admin',
    'apps/admin/src/routes': 'app:admin',
    'apps/api/src': 'svc:api',
    'packages/design-system/src': 'lib:design-system',
    'packages/api-spec/src': 'lib:api-spec',
    'packages/api-spec/generated': 'lib:api-spec',
  },

  depRules: {
    'app:*': [sameTag, 'lib:design-system', 'lib:api-spec'],
    'svc:*': [sameTag, 'lib:api-spec'],
    'lib:design-system': noDependencies,
    'lib:api-spec': noDependencies,
    root: ['app:store', 'app:admin', 'svc:api', 'lib:design-system', 'lib:api-spec', 'noTag'],
    noTag: ['noTag', 'lib:design-system', 'lib:api-spec'],
  },
}
```

---

## 태그 시스템 — 모듈 분류 체계

**Problem** — 모노레포가 커지면 "어디서든 아무거나 import"하는 스파게티 의존성이 발생한다. 백엔드 API 서버에서 React 컴포넌트를 import하거나, UI 패키지가 백엔드 전용 라이브러리에 의존하는 상황이 코드 리뷰에서 빠져나갈 수 있다.

```ts
// ❌ apps/api/src/routes/health.ts에서 디자인 시스템 import
import { Button } from '@fullstack-forge/design-system/components/button'
```

이런 import는 타입체크를 통과하고, 번들러도 에러를 내지 않는다. 코드 리뷰에 의존하는 것은 확장 불가능하다.

**Action** — Sheriff의 `modules` 맵으로 디렉토리 경로에 의미 있는 태그를 부여한다:

```ts
modules: {
  // 프론트엔드 앱: app:* 태그
  'apps/store/src/screens': 'app:store',
  'apps/store/src/routes': 'app:store',
  'apps/admin/src/screens': 'app:admin',
  'apps/admin/src/routes': 'app:admin',

  // 백엔드 서비스: svc:* 태그
  'apps/api/src': 'svc:api',

  // 라이브러리: lib:* 태그
  'packages/design-system/src': 'lib:design-system',
  'packages/api-spec/src': 'lib:api-spec',
  'packages/api-spec/generated': 'lib:api-spec',
}
```

태그 네이밍 컨벤션은 `{레이어}:{이름}`:

| 접두사  | 의미                        | 예시                              |
| ------- | --------------------------- | --------------------------------- |
| `app:`  | 사용자 대면 프론트엔드 앱   | `app:store`, `app:admin`          |
| `svc:`  | 백엔드 서비스               | `svc:api`                         |
| `lib:`  | 공유 라이브러리/패키지      | `lib:design-system`, `lib:api-spec` |

**Result** — 모든 소스 디렉토리가 명확한 레이어에 속하게 된다. 이 태그가 `depRules`의 기반이 된다.

---

## `depRules` — 의존 방향 화이트리스트

**Problem** — 태그만으로는 강제력이 없다. "store 앱이 design-system을 쓸 수 있다"는 규칙을 코드로 표현하고, 위반 시 빌드를 실패시켜야 한다.

**Action** — `depRules`는 "이 태그의 모듈은 어떤 태그에만 의존할 수 있다"를 선언한다:

```ts
depRules: {
  // 프론트엔드 앱 → 같은 앱 내부 + 디자인 시스템 + API 명세
  'app:*': [sameTag, 'lib:design-system', 'lib:api-spec'],

  // 백엔드 서비스 → 같은 서비스 내부 + API 명세만 (디자인 시스템 금지!)
  'svc:*': [sameTag, 'lib:api-spec'],

  // 라이브러리 → 외부 의존 금지 (순수 유지)
  'lib:design-system': noDependencies,
  'lib:api-spec': noDependencies,
}
```

이를 도식화하면:

```
app:store  ──→  lib:design-system  ✅
app:store  ──→  lib:api-spec       ✅
app:admin  ──→  lib:design-system  ✅
app:admin  ──→  lib:api-spec       ✅

svc:api    ──→  lib:api-spec       ✅
svc:api    ──→  lib:design-system  ❌  ← 핵심 차단 포인트

lib:*      ──→  (아무것도)          ❌  ← 순수 유지
```

`sameTag`는 같은 태그 내의 모듈 간 import를 허용한다 (예: `app:store` 내의 screens → routes).

**Result** — 의존 방향이 코드로 강제된다. API 서버에서 React 컴포넌트를 import하면 `pnpm sheriff`가 즉시 에러를 보고한다. CI에서 자동 검증되므로 코드 리뷰 부담이 줄어든다. ✅ 2026.02 기준 모노레포 아키텍처 경계 강제의 표준 접근법.

> **Caveat**: Sheriff는 **소스 레벨** import만 검사한다. `package.json`의 `dependencies` 필드는 검사하지 않으므로, `pnpm add`로 금지된 패키지를 추가하는 것은 막지 못한다. Knip과 조합하여 미사용 의존성도 함께 관리해야 한다.

---

## `enableBarrelLess` — barrel 파일 없는 직접 import

**Problem** — 전통적으로 패키지는 `index.ts` barrel 파일로 공개 API를 노출했다:

```ts
// packages/design-system/src/index.ts (barrel file)
export { Button } from './components/button'
export { Card } from './components/card'
export { cn } from './lib/utils'
// ... 20+ 개 re-export
```

이 패턴의 문제:

1. **Tree-shaking 방해**: 번들러가 barrel을 통해 모든 컴포넌트를 로드한 후 사용하지 않는 것을 제거해야 한다
2. **유지보수 부담**: 컴포넌트 추가/삭제 시 barrel 파일을 반드시 업데이트해야 한다
3. **순환 참조 위험**: barrel을 통한 간접 참조가 순환 의존을 만들기 쉽다

**Action** — `enableBarrelLess: true`로 barrel 파일 없이 직접 import를 강제한다:

```ts
// ✅ barrel-less: 직접 경로로 import
import { Button } from '@fullstack-forge/design-system/components/button'
import { cn } from '@fullstack-forge/design-system/lib/utils'

// ❌ barrel 경유: Sheriff가 차단
import { Button } from '@fullstack-forge/design-system'
```

이 설정은 `package.json`의 `exports` 맵과 함께 작동한다:

```jsonc
// packages/design-system/package.json
{
  "exports": {
    "./components/*": "./src/components/*.tsx",
    "./lib/*": "./src/lib/*.ts",
    "./hooks/*": "./src/hooks/*.ts",
    "./styles/*": "./src/styles/*.css"
  }
}
```

**Result** — 각 import가 정확히 필요한 파일만 가리킨다. Tree-shaking이 최적으로 동작하고, barrel 파일 유지보수가 사라진다. 새 컴포넌트를 추가할 때 별도 등록 과정 없이 바로 사용 가능하다.

> **Caveat**: barrel-less 구조에서는 패키지의 내부 경로가 공개 API가 된다. 파일명이나 디렉토리 구조를 변경하면 소비자 코드의 import 경로도 모두 바뀌므로, 디렉토리 구조를 안정적으로 유지해야 한다.

---

## `entryPoints` — 분석 시작점

**Problem** — Sheriff가 모듈 경계를 검사하려면 어디서부터 import 그래프를 추적할지 알아야 한다. 모노레포에는 여러 앱이 있고, 각 앱의 진입점이 다르다.

**Action** — `entryPoints`로 각 앱의 시작 파일을 선언한다:

```ts
entryPoints: {
  store: './apps/store/src/router.tsx',
  admin: './apps/admin/src/router.tsx',
  api: './apps/api/src/index.ts',
}
```

Sheriff는 이 진입점에서 출발하여 import 체인을 따라가며, 각 import가 `depRules`를 위반하는지 검사한다.

**Result** — 진입점이 명시되어 있으므로 Sheriff가 불필요한 파일(테스트, 설정 파일 등)을 분석하지 않고, 실제 런타임 의존 그래프만 검증한다.

---

## 이 프로젝트에서의 적용

| 결정                           | 해결하는 문제                                       |
| ------------------------------ | --------------------------------------------------- |
| 태그 시스템 (`app:`, `svc:`, `lib:`) | 레이어 분류로 의존 방향 규칙의 기반 제공        |
| `depRules` 화이트리스트        | API 서버가 UI를 import하는 등의 아키텍처 위반 차단  |
| `enableBarrelLess: true`       | barrel 파일 제거로 tree-shaking 최적화 + 유지보수 감소 |
| `svc:*`에서 `lib:design-system` 차단 | 백엔드에 프론트엔드 의존성 유입 원천 차단       |
| `lib:*`에 `noDependencies`     | 공유 라이브러리의 순수성 보장                       |

---

## 다음 문서

[03. CI 파이프라인 — codegen-first 검증 전략](./03-ci-pipeline.md) — knip, sheriff, typecheck, build, test를 CI에서 어떤 순서로 실행해야 하는가?
