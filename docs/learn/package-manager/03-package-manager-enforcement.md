# 03. 패키지 매니저 강제

## 핵심 질문

> 팀원이 npm이나 yarn을 실수로 쓰는 걸 어떻게 막는가?

## 한 줄 답

`package.json`의 `packageManager` 필드로 pnpm 버전을 선언하고, `corepack enable`로 Node.js가 자동으로 올바른 패키지 매니저를 사용하게 강제한다. 보조 수단으로 `engines` 필드와 `only-allow` 패턴이 있다.

---

## 현재 설정

```jsonc
// package.json
{
  "packageManager": "pnpm@10.5.2",
}
```

---

## `packageManager` 필드 — 패키지 매니저와 버전 선언

**Problem** — 모노레포에 여러 개발자가 참여하면, 누군가는 `npm install`, 누군가는 `yarn add`를 실행한다. 패키지 매니저가 섞이면 `node_modules` 구조가 달라지고, lockfile이 충돌하며, "내 환경에서는 되는데"가 일상이 된다. pnpm 프로젝트에서 `npm install`을 실행하면 `package-lock.json`이 생성되어 `pnpm-lock.yaml`과 공존하는 혼돈이 벌어진다.

```
# npm install을 실수로 실행한 후
루트/
├── node_modules/          ← flat 구조 (npm)
├── package-lock.json      ← npm이 생성
├── pnpm-lock.yaml         ← 기존 pnpm lockfile
└── pnpm-workspace.yaml    ← pnpm이 이걸 보는데 npm은 무시
```

**Action** — `package.json`의 `packageManager` 필드는 Node.js 공식 스펙(Corepack)이 인식하는 선언이다. 이 프로젝트에서는 정확한 pnpm 버전을 명시한다:

```jsonc
{
  "packageManager": "pnpm@10.5.2",
}
```

이 필드의 효과:

1. **Corepack 연동** — `corepack enable` 후, `npm install`이나 `yarn add`를 실행하면 에러가 발생한다
2. **버전 고정** — 팀 전체가 동일한 pnpm 버전을 사용하도록 보장한다
3. **CI 일관성** — CI 환경에서도 이 필드를 읽어 정확한 버전의 pnpm을 사용한다

**Result** — 패키지 매니저와 버전이 소스 코드에 선언되어, 별도 문서나 구두 약속 없이도 `git clone` → `corepack enable` → `pnpm install`만으로 올바른 환경이 구성된다. ✅ Node.js 18.17+ 공식 지원 기능.

---

## `corepack enable` — 런타임 강제 메커니즘

**Problem** — `packageManager` 필드가 있어도 Corepack이 활성화되지 않으면 그냥 메타데이터에 불과하다. 개발자가 `corepack enable`을 실행하지 않으면 `npm install`이 아무 에러 없이 동작하여 lockfile 충돌이 발생한다.

**Action** — Corepack은 Node.js에 내장된 패키지 매니저 프록시다. `corepack enable`을 한 번 실행하면, 이후 `npm`, `yarn`, `pnpm` 명령어가 `packageManager` 필드와 대조되어 불일치 시 차단된다:

```bash
# 1회 활성화 (로컬 또는 CI 셋업)
corepack enable

# 이후 동작
pnpm install          # ✅ packageManager와 일치 — 정상 실행
npm install           # ❌ 에러: This project is configured to use pnpm
yarn install          # ❌ 에러: This project is configured to use pnpm
pnpm@9.0.0 install    # ❌ 에러: Expected pnpm@10.5.2
```

CI에서의 설정 (GitHub Actions 예시):

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '22'
- run: corepack enable
- run: pnpm install
```

**Result** — 잘못된 패키지 매니저 사용이 실행 시점에 즉시 차단된다. `packageManager` 필드와 Corepack의 조합이 현재 Node.js 생태계의 표준 강제 메커니즘. ✅ 2026.02 기준 Node.js 22 LTS에서 안정적으로 동작.

> **Caveat**: Corepack은 Node.js에 포함되어 있지만 아직 `experimental` 상태다. 다만 pnpm, yarn 모두 Corepack 지원을 공식 권장하고 있어 실무에서는 안정적이다. Node.js 측에서도 GA 전환을 준비 중이다.

---

## `only-allow` 패턴 — preinstall 훅 방어

**Problem** — Corepack을 활성화하지 않은 환경에서도 잘못된 패키지 매니저 사용을 막고 싶은 경우가 있다. 특히 오래된 CI 환경이나 Corepack 지원이 불확실한 도구 체인에서 보조 방어가 필요하다.

**Action** — `only-allow` 패키지를 `preinstall` 스크립트에 넣는 패턴이 있다:

```jsonc
// package.json (이 프로젝트에서는 미사용 — Corepack으로 충분)
{
  "scripts": {
    "preinstall": "npx only-allow pnpm",
  },
}
```

동작 원리:

1. `npm install` 또는 `yarn install` 실행 시 `preinstall` 스크립트가 먼저 동작
2. `only-allow pnpm`이 현재 실행 중인 패키지 매니저를 확인
3. pnpm이 아니면 에러를 던지고 설치 중단

**Result** — Corepack 없이도 동작하는 가벼운 방어막. 다만 이 프로젝트에서는 `packageManager` + Corepack 조합으로 충분하므로 `only-allow`는 사용하지 않는다. 레거시 환경 호환이 필요한 프로젝트에서는 보조 수단으로 유용하다.

> **Caveat**: `preinstall`에서 `npx only-allow pnpm`을 실행하면, 역설적으로 `npx`(npm의 도구)를 사용하게 된다. 이 프로젝트는 `pnpm exec`를 표준 실행 방식으로 사용하므로 `npx` 의존과 충돌할 수 있다.

---

## `engines` 필드 — Node.js 버전 가드

**Problem** — 패키지 매니저 버전을 고정해도 Node.js 버전이 다르면 동작이 달라진다. `Intl`, `structuredClone`, `fetch` 등 런타임 API 가용성이 Node.js 버전에 따라 다르고, pnpm 10 자체도 Node.js 18.12+ 를 요구한다.

**Action** — `engines` 필드로 Node.js 최소 버전을 선언한다:

```jsonc
// package.json (권장 설정)
{
  "engines": {
    "node": ">=22.0.0",
  },
}
```

`engines`는 기본적으로 경고만 표시하지만, `.npmrc`에 `engine-strict=true`를 설정하면(pnpm v10에서 기본값이 아님) 설치를 차단할 수 있다.

**Result** — 패키지 매니저(`packageManager`)와 런타임(`engines`)을 모두 선언하면, `git clone` 후 환경 불일치를 조기에 발견할 수 있다. ✅ `packageManager`와 `engines`의 조합이 완전한 환경 스펙 선언.

---

## 이 프로젝트에서의 적용

| 결정                  | 해결하는 문제                                     |
| --------------------- | ------------------------------------------------- |
| `packageManager` 필드 | pnpm 10.5.2 버전 고정, 소스 코드에 환경 스펙 선언 |
| `corepack enable`     | npm/yarn 실수 사용 시 즉시 차단                   |
| `only-allow` 미사용   | Corepack으로 충분, npx 의존 역설 회피             |
| `engines` 필드        | Node.js 버전 불일치 조기 발견                     |

---

## 다음 문서

이 토픽의 마지막 문서입니다. [인덱스로 돌아가기](./README.md)
