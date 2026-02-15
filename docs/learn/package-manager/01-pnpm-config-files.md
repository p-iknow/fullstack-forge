# 01. pnpm 설정 파일 체계

## 핵심 질문

> `.npmrc`, `pnpm-workspace.yaml`, `package.json`의 `pnpm` 필드 — 각각 뭘 담당하는가?

## 한 줄 답

`.npmrc`는 **런타임 동작**, `pnpm-workspace.yaml`은 **워크스페이스 구조 + 버전 카탈로그**, `package.json`의 `pnpm` 필드는 **패키지 빌드/의존성 오버라이드**. 세 파일이 역할을 나눠 가진다.

---

## 현재 접근 방식

이 프로젝트는 pnpm 10.5.2를 사용하며, 설정이 세 파일에 분산되어 있다:

```
루트/
├── .npmrc                 ← 런타임 동작 (현재 주석만 — v10 기본값 충분)
├── pnpm-workspace.yaml    ← 워크스페이스 패키지 + catalog (버전 중앙 관리)
└── package.json           ← packageManager + pnpm.onlyBuiltDependencies
```

---

## `.npmrc` — 런타임 동작 설정

**Problem** — pnpm의 동작 옵션(hoisting, strict peer deps, auto-install 등)을 어디에 둘지 모호하면, 같은 설정이 `package.json`과 `.npmrc`에 중복되거나, 설정 파일을 찾아 헤매게 된다. 특히 pnpm v10에서 여러 기본값이 바뀌면서, 이전 버전에서 명시적으로 적어야 했던 옵션들이 불필요해졌다.

**Action** — `.npmrc`는 pnpm의 **런타임 동작**만 담당한다. 레지스트리 URL, hoisting 전략, strict peer deps, 링크 방식 등 `pnpm install`과 `pnpm run` 시점의 동작을 제어한다. 이 프로젝트에서는 v10 기본값이 이미 원하는 동작과 일치하므로, 명시적 설정 없이 주석만 남겨두었다:

```ini
# .npmrc
# pnpm v10 defaults are sufficient for now.
# Storybook hoist-pattern will be added when Storybook is set up (Unit 3+).
```

v10에서 기본값이 된 설정들 (이전에 명시해야 했던 것들):

| 설정                                | v10 기본값 | 의미                            |
| ----------------------------------- | ---------- | ------------------------------- |
| `shamefully-hoist`                  | `false`    | flat `node_modules` 안 만듦     |
| `strict-peer-dependencies`          | `true`     | peer dep 불일치 시 에러         |
| `auto-install-peers`                | `true`     | peer dep 자동 설치              |
| `dedupe-peer-dependents`            | `true`     | peer dep 중복 제거              |
| `resolve-peers-from-workspace-root` | `true`     | 워크스페이스 루트에서 peer 해석 |

**Result** — `.npmrc`가 사실상 비어 있어 관리 부담이 없다. v10 기본값과 다른 동작이 필요할 때만 여기에 추가하면 된다. ✅ 2026.02 기준 v10 기본값 활용이 권장 패턴.

---

## `pnpm-workspace.yaml` — 워크스페이스 구조와 버전 카탈로그

**Problem** — 모노레포에서 패키지 위치를 선언하지 않으면 pnpm이 개별 패키지를 인식하지 못하고, 50개 이상의 의존성 버전을 각 `package.json`에서 따로 관리하면 버전 불일치와 업데이트 지옥에 빠진다.

**Action** — `pnpm-workspace.yaml`은 두 가지를 담당한다:

1. **`packages`** — 워크스페이스에 속하는 패키지 경로 glob

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

2. **`catalog`** — 버전 중앙 관리 (pnpm 9.5+)

```yaml
catalog:
  # --- React / Frontend ---
  react: ^19.2.4
  react-dom: ^19.2.4
  vite: ^7.3.1
  # --- Backend ---
  hono: ^4.11.9
  drizzle-orm: ^0.45.1
  # --- Shared Tooling ---
  typescript: ~5.9.3
  vitest: ^4.0.18
```

각 패키지의 `package.json`에서 `"catalog:"`로 참조하면 버전이 자동 해석된다:

```jsonc
// packages/shared/package.json
{
  "devDependencies": {
    "typescript": "catalog:", // → ~5.9.3
    "vitest": "catalog:", // → ^4.0.18
  },
}
```

**Result** — 버전 진실 공급원(Single Source of Truth)이 하나로 통합된다. 의존성 업데이트 시 `pnpm-workspace.yaml`만 수정하면 전체 워크스페이스에 반영. Renovate/Dependabot도 이 파일만 PR 타겟으로 삼으면 된다. ✅ 2026.02 기준 pnpm 모노레포의 표준 패턴.

> **Caveat**: `catalog:`는 pnpm 9.5+에서 도입되었다. 이전 버전에서는 동작하지 않으므로, `packageManager` 필드로 팀 전체 pnpm 버전을 고정하는 것이 전제 조건이다 (04 문서 참조).

---

## `package.json`의 `pnpm` 필드 — 패키지 빌드와 의존성 제어

**Problem** — 특정 패키지(`esbuild`, `nx` 등)는 설치 시 네이티브 바이너리를 빌드(postinstall)하는데, 모든 패키지의 postinstall을 허용하면 보안 위험이 있고, 필요 없는 빌드로 설치 시간이 늘어난다. 반대로 전부 차단하면 필수 도구가 동작하지 않는다.

**Action** — `package.json`의 `pnpm` 필드에서 빌드 허용 목록을 관리한다:

```jsonc
// package.json
{
  "pnpm": {
    "onlyBuiltDependencies": ["esbuild", "nx"],
  },
}
```

`onlyBuiltDependencies`는 **화이트리스트** 방식으로, 명시된 패키지만 postinstall 스크립트 실행을 허용한다. 이 밖에도 `pnpm` 필드는 다음을 담당할 수 있다:

| 하위 필드                   | 역할                                 | 이 프로젝트 사용 여부 |
| --------------------------- | ------------------------------------ | --------------------- |
| `onlyBuiltDependencies`     | postinstall 빌드 화이트리스트        | ✅ 사용               |
| `overrides`                 | 의존성 버전 강제 교체                | ❌ 미사용             |
| `peerDependencyRules`       | peer dep 경고/에러 규칙 커스터마이즈 | ❌ 미사용             |
| `allowedDeprecatedVersions` | deprecated 패키지 허용 목록          | ❌ 미사용             |

**Result** — `esbuild`와 `nx`만 네이티브 빌드를 수행하고, 나머지 패키지의 postinstall은 무시된다. 설치 시간 단축 + 공급망 공격(supply chain attack) 표면 축소. ✅ pnpm v10의 보안 강화 기조와 일치.

---

## 이 프로젝트에서의 적용

| 결정                            | 해결하는 문제                                    |
| ------------------------------- | ------------------------------------------------ |
| `.npmrc` 비우기 (v10 기본값)    | 불필요한 명시적 설정 제거, 관리 포인트 최소화    |
| `pnpm-workspace.yaml`에 catalog | 50+ 의존성 버전을 한 파일에서 중앙 관리          |
| `pnpm.onlyBuiltDependencies`    | postinstall 화이트리스트로 보안 + 설치 속도 확보 |

---

## 다음 문서

[02. Hoisting 전략](./02-hoisting-strategy.md) — `shamefully-hoist`, `hoist-pattern`, `public-hoist-pattern` — 왜 기본값으로 충분한가?
