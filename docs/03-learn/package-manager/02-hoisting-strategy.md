# 02. Hoisting 전략

## 핵심 질문

> `shamefully-hoist`, `hoist-pattern`, `public-hoist-pattern` — 왜 기본값으로 충분한가?

## 한 줄 답

pnpm v10의 기본값(`shamefully-hoist=false`, 선별적 hoisting)이 이미 strict isolation을 보장한다. Storybook처럼 flat `node_modules`를 요구하는 도구가 추가될 때만 `hoist-pattern`을 확장하면 된다.

---

## 현재 설정

```ini
# .npmrc
# pnpm v10 defaults are sufficient for now.
# Storybook hoist-pattern will be added when Storybook is set up (Unit 3+).
```

명시적 hoisting 설정 없음 — v10 기본값을 그대로 사용한다.

---

## `shamefully-hoist=false` — strict isolation 유지

**Problem** — npm과 yarn(classic)은 모든 의존성을 flat하게 `node_modules` 루트에 올려놓는다(hoisting). 이 때문에 `package.json`에 선언하지 않은 패키지도 `import`할 수 있다(phantom dependency). 프로젝트가 커지면 "내 로컬에서는 되는데 CI에서 안 됨" 같은 유령 의존성 버그가 발생한다.

```
# npm/yarn classic의 flat node_modules
node_modules/
├── react/           ← 직접 설치
├── react-dom/       ← 직접 설치
├── scheduler/       ← react-dom의 의존성인데 직접 import 가능 (phantom)
└── loose-envify/    ← 누가 쓰는지도 모름 (phantom)
```

**Action** — pnpm은 기본적으로 content-addressable store + symlink 구조를 사용하여 각 패키지가 자기 의존성만 볼 수 있게 격리한다. `shamefully-hoist=true`로 설정하면 npm처럼 flat 구조로 돌아가는데, 이는 하위 호환성을 위한 탈출구일 뿐 권장되지 않는다. pnpm v10에서 `shamefully-hoist`의 기본값은 `false`이므로 별도 설정이 필요 없다.

```
# pnpm의 격리된 node_modules (기본)
node_modules/
├── .pnpm/                    ← content-addressable store 링크
│   ├── react@19.2.4/
│   │   └── node_modules/
│   │       └── react/
│   └── react-dom@19.2.4/
│       └── node_modules/
│           ├── react-dom/
│           └── scheduler/    ← react-dom만 접근 가능
├── react -> .pnpm/react@19.2.4/node_modules/react
└── react-dom -> .pnpm/react-dom@19.2.4/node_modules/react-dom
```

**Result** — phantom dependency 완전 차단. 선언하지 않은 패키지를 import하면 즉시 에러가 발생해 문제를 조기에 잡는다. ✅ pnpm의 핵심 가치이자 v10 기본 동작.

---

## `hoist-pattern` — 선별적 hoisting (Storybook 대응 유보)

**Problem** — 일부 도구(대표적으로 Storybook)는 플러그인 탐색 시 `node_modules` 루트에 패키지가 있어야 동작한다. pnpm의 strict isolation 하에서 이런 도구는 의존성을 찾지 못해 실행에 실패한다.

```
# Storybook이 플러그인을 탐색하는 방식
require.resolve('@storybook/addon-a11y')
// → strict isolation에서는 storybook 패키지 내부에서만 접근 가능
// → 루트 node_modules에 없으면 실패
```

**Action** — `hoist-pattern`은 특정 패키지를 `.pnpm` 내부의 가상 store가 아닌, `node_modules` 루트로 끌어올릴 패턴을 지정한다. 이 프로젝트에서는 Storybook이 Unit 3+에서 도입 예정이므로, 그때 아래 설정을 `.npmrc`에 추가할 계획이다:

```ini
# .npmrc (Unit 3+에서 추가 예정)
hoist-pattern[]=*storybook*
hoist-pattern[]=@storybook/*
```

현재는 Storybook을 사용하지 않으므로 설정하지 않는다. 필요 없는 hoisting을 미리 열어두면 strict isolation의 이점이 줄어든다.

**Result** — "필요할 때만 hoisting을 여는" 점진적 접근. strict isolation을 최대한 유지하면서 도구 호환성 문제가 실제로 발생할 때 대응한다. ✅ pnpm 공식 문서의 권장 방식.

> **Caveat**: `hoist-pattern`의 기본값은 `['*']`로, `.pnpm` 내부에서의 hoisting은 허용한다(이것은 `node_modules` 루트 hoisting과 다르다). 여기서 추가하는 패턴은 `.pnpm` 바깥, 즉 `node_modules` 루트까지 끌어올리는 것이다.

---

## `public-hoist-pattern` — 타입 패키지의 루트 노출

**Problem** — TypeScript의 `@types/*` 패키지는 특수한 위치에서 검색된다. `@types/react`가 `node_modules/@types/react`에 없으면 IDE 자동완성이 깨지거나, 타입 체크 시 `Cannot find module '@types/react'` 에러가 발생할 수 있다.

**Action** — pnpm의 `public-hoist-pattern` 기본값은 `['*types*', '*eslint*', '@prettier/plugin-*']`이다. 이 패턴에 의해 `@types/*` 패키지들이 자동으로 `node_modules` 루트에 심링크된다. 별도 설정 없이 TypeScript 타입 해석이 정상 동작한다.

```
# public-hoist-pattern 기본값에 의한 자동 hoisting
node_modules/
├── @types/
│   ├── react/      ← public-hoist로 루트에 노출
│   ├── react-dom/  ← public-hoist로 루트에 노출
│   └── node/       ← public-hoist로 루트에 노출
├── react -> .pnpm/...
└── .pnpm/...
```

**Result** — TypeScript, ESLint 등 전역 탐색이 필요한 도구들이 별도 설정 없이 동작한다. ✅ v10 기본값으로 충분하며 커스터마이즈할 필요 없음.

---

## 이 프로젝트에서의 적용

| 결정                          | 해결하는 문제                                     |
| ----------------------------- | ------------------------------------------------- |
| `shamefully-hoist=false`      | phantom dependency 차단, strict isolation 유지    |
| `hoist-pattern` 미설정        | 불필요한 hoisting 방지 (Storybook은 Unit 3+ 대응) |
| `public-hoist-pattern` 기본값 | `@types/*` 자동 노출로 TypeScript 호환성 확보     |

---

## 다음 문서

[03. 패키지 매니저 강제](./03-package-manager-enforcement.md) — 팀원이 npm이나 yarn을 실수로 쓰는 걸 어떻게 막는가?
