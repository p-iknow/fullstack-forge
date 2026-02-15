# 03. 패키지 실행 명령어

## 핵심 질문

> `npx` vs `pnpm exec` vs `pnpm dlx` — 언제 어떤 걸 쓰는가?

## 한 줄 답

**설치된 패키지 실행은 `pnpm exec`**, **임시 실행은 `pnpm dlx`**, **`npx`는 pnpm 프로젝트에서 쓰지 않는다**. 이 프로젝트에서는 11개 문서의 `npx`를 `pnpm exec`로 교체했다.

---

## 현재 흐름

```
패키지 실행이 필요한 상황
│
├─ 이미 설치된 패키지의 CLI?
│  └─ YES → pnpm exec <command>
│     예: pnpm exec nx show projects
│         pnpm exec nx run-many -t build
│
├─ 설치 없이 한 번만 실행?
│  └─ YES → pnpm dlx <package> <command>
│     예: pnpm dlx create-next-app my-app
│         pnpm dlx degit user/repo
│
└─ npx <command>?
   └─ NO — pnpm 프로젝트에서는 사용하지 않음
```

---

## `pnpm exec` — 설치된 패키지 실행

**Problem** — 모노레포에서 `nx`, `vitest`, `tsc` 같은 도구를 실행할 때 경로를 일일이 지정하기 번거롭다. `./node_modules/.bin/nx run-many -t build`는 길고, 특히 CI 스크립트에서 반복하면 가독성이 떨어진다.

**Action** — `pnpm exec`는 현재 프로젝트의 `node_modules/.bin`에 설치된 바이너리를 실행한다. pnpm의 strict isolation 환경에서 정확한 의존성만 사용하는 것이 보장된다:

```bash
# 워크스페이스에 설치된 nx 실행
pnpm exec nx show projects

# 전체 빌드
pnpm exec nx run-many -t build

# 타입 체크 + 빌드 + 테스트 통합 검증
pnpm exec nx run-many -t codegen && pnpm check && pnpm build && pnpm test
```

이 프로젝트에서 `pnpm exec`가 사용되는 곳:

| 파일                                            | 명령어                                          |
| ----------------------------------------------- | ----------------------------------------------- |
| `docs/execution/00-workspace-baseline.md`       | `pnpm exec nx show projects`                    |
| `docs/execution/00-workspace-baseline.md`       | `pnpm exec nx graph`                            |
| `docs/harness/05-integration.md`                | `pnpm exec nx run-many -t codegen`              |
| `docs/harness/06-tooling.md`                    | `pnpm exec nx run-many -t typecheck build test` |
| `docs/execution/07-operations-and-readiness.md` | 통합 검증 명령어                                |

**Result** — 패키지 매니저와 실행 환경이 일치한다. pnpm으로 설치하고 pnpm으로 실행하면, `node_modules` 구조 차이로 인한 "npm에서는 되는데 pnpm에서는 안 됨" 문제가 원천 차단된다. ✅ pnpm 프로젝트의 표준 실행 방식.

---

## `pnpm dlx` — 임시 패키지 실행

**Problem** — 프로젝트 초기화(`create-next-app`, `degit`), 일회성 마이그레이션 도구, 또는 특정 버전 테스트처럼 **설치 없이 한 번만 실행**하고 싶은 상황이 있다. 이를 위해 `devDependencies`에 추가하면 프로젝트가 불필요한 의존성으로 오염된다.

**Action** — `pnpm dlx`는 패키지를 임시 디렉토리에 다운로드하고 실행한 뒤 삭제한다. npm의 `npx`에 해당하지만, pnpm의 store를 활용하므로 캐싱이 더 효율적이다:

```bash
# 프로젝트 스캐폴딩
pnpm dlx create-next-app my-app

# 특정 버전의 도구 실행
pnpm dlx typescript@5.8.0 --version

# 일회성 유틸리티
pnpm dlx degit user/template my-project
```

**Result** — `devDependencies` 오염 없이 일회성 도구를 안전하게 실행. ✅ `npx`의 pnpm 대응 명령어.

> **Caveat**: `pnpm dlx`는 매번 최신 버전을 가져온다. 특정 버전이 필요하면 `pnpm dlx package@version`으로 명시하라.

---

## `npx` 사용 금지 — pnpm 프로젝트에서의 위험

**Problem** — `npx`는 npm에 포함된 도구로, pnpm의 `node_modules` 구조를 이해하지 못한다. pnpm 프로젝트에서 `npx`를 쓰면 다음 문제가 발생한다:

1. **잘못된 바이너리 실행** — `npx`가 전역 npm 캐시나 다른 경로의 바이너리를 찾아 실행할 수 있다
2. **암묵적 설치** — 로컬에 없으면 사용자 확인 없이(또는 한 번의 프롬프트로) 패키지를 설치하고 실행한다
3. **버전 불일치** — pnpm의 `catalog:`이나 `pnpm-lock.yaml`과 무관한 버전이 실행될 수 있다

```bash
# 위험: npx는 pnpm의 node_modules 구조를 모른다
npx nx show projects
# → 전역 nx를 실행할 수도, 다른 버전을 설치할 수도 있음

# 안전: pnpm exec는 워크스페이스의 정확한 nx를 실행한다
pnpm exec nx show projects
# → node_modules/.bin/nx (pnpm-lock.yaml에 고정된 버전)
```

**Action** — 이 프로젝트에서는 11개 문서에 걸쳐 모든 `npx` 호출을 `pnpm exec`로 교체했다. 문서뿐 아니라 CI 스크립트, 팀원 가이드에서도 동일한 원칙을 적용한다.

교체 원칙:

| 원래 명령어         | 교체 후               | 이유                  |
| ------------------- | --------------------- | --------------------- |
| `npx nx ...`        | `pnpm exec nx ...`    | 설치된 nx 정확히 실행 |
| `npx create-xxx`    | `pnpm dlx create-xxx` | 임시 실행은 dlx       |
| `npx --yes package` | `pnpm dlx package`    | 암묵적 설치 방지      |

**Result** — 패키지 매니저 일관성 확보. npm/pnpm 혼용으로 인한 "내 환경에서만 되는" 문제가 원천 차단된다. ✅ pnpm 공식 문서에서도 `npx` 대신 `pnpm exec`/`pnpm dlx` 사용을 권장.

---

## 이 프로젝트에서의 적용

| 결정                   | 해결하는 문제                                     |
| ---------------------- | ------------------------------------------------- |
| `pnpm exec` 전면 채택  | 설치된 바이너리를 pnpm 환경에서 정확히 실행       |
| `pnpm dlx` 임시 실행용 | 프로젝트 의존성 오염 없이 일회성 도구 사용        |
| `npx` 사용 금지        | 패키지 매니저 혼용으로 인한 버전·경로 불일치 차단 |

---

## 다음 문서

[04. 패키지 매니저 강제](./04-package-manager-enforcement.md) — 팀원이 npm이나 yarn을 실수로 쓰는 걸 어떻게 막는가?
