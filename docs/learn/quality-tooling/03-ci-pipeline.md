# 03. CI 파이프라인 — codegen-first 검증 전략

## 핵심 질문

> knip, sheriff, typecheck, build, test를 CI에서 어떤 순서로 실행해야 하는가?

## 한 줄 답

**codegen → lint/format → sheriff/knip → typecheck/build/test** 순서로, 생성 코드가 최신인 상태에서만 나머지 검증을 수행한다.

---

## 현재 흐름

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  main:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          filter: tree:0
          fetch-depth: 0

      - uses: pnpm/action-setup@v4
        with: { version: 10 }

      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: 'pnpm' }

      - run: pnpm install --frozen-lockfile

      # Phase 1: 코드 생성
      - run: pnpm exec nx run-many -t codegen
      - run: git diff --exit-code packages/api-spec/generated/openapi.yaml

      # Phase 2: 정적 분석
      - run: pnpm lint
      - run: pnpm format:check

      # Phase 3: 빌드 + 테스트
      - run: pnpm exec nx run-many -t typecheck build test
```

실행 순서를 단계(phase)로 나눠서 살펴보자:

```
┌─────────────┐    ┌──────────────┐    ┌──────────────────────┐
│  Phase 1    │ →  │  Phase 2     │ →  │  Phase 3             │
│  codegen    │    │  lint/format │    │  typecheck/build/test│
│  + stale    │    │  + sheriff   │    │                      │
│    check    │    │  + knip      │    │                      │
└─────────────┘    └──────────────┘    └──────────────────────┘
```

---

## Phase 1: codegen + stale check — 생성 코드 최신성 보장

**Problem** — TypeSpec에서 `openapi.yaml`과 `types.ts`를 생성하는데, 개발자가 TypeSpec을 수정한 후 codegen을 잊고 커밋하면 생성된 파일이 낡은(stale) 상태로 남는다. 이 상태에서 typecheck나 build가 성공하더라도 실제 API 계약과 코드가 불일치한다.

```bash
# 개발자가 TypeSpec을 수정했지만 codegen을 잊은 경우
# → openapi.yaml은 이전 버전, types.ts도 이전 버전
# → typecheck 통과하지만 런타임에서 API 불일치 발생
```

**Action** — CI의 첫 단계에서 codegen을 실행하고, 생성 결과가 커밋된 파일과 동일한지 `git diff`로 검증한다:

```yaml
- run: pnpm exec nx run-many -t codegen
- run: git diff --exit-code packages/api-spec/generated/openapi.yaml
```

`nx run-many -t codegen`은 모든 워크스페이스의 `codegen` 스크립트를 실행한다. `git diff --exit-code`는 차이가 있으면 종료 코드 1을 반환하여 CI를 실패시킨다.

**Result** — stale 생성 코드가 main에 합류하는 것을 원천 차단한다. 개발자는 PR에서 "codegen을 다시 실행하고 커밋하세요"라는 명확한 피드백을 받는다. ✅ contract-first 워크플로의 필수 게이트.

---

## Phase 2: 정적 분석 — lint, format, sheriff, knip

**Problem** — 정적 분석 도구들은 서로 다른 관심사를 검사한다. 순서가 잘못되면 codegen 이전의 낡은 코드를 분석하거나, 빌드 실패 시 불필요한 분석 시간을 소비한다.

**Action** — codegen 직후, 빌드 이전에 모든 정적 분석을 실행한다:

```yaml
- run: pnpm lint # oxlint — 코드 품질/스타일
- run: pnpm format:check # oxfmt — 포매팅 일관성
```

harness 레시피(06-tooling.md)에는 sheriff와 knip도 이 단계에 포함되어 있다:

```yaml
# harness 기준 전체 Phase 2
- run: pnpm lint
- run: pnpm format:check
- run: pnpm sheriff # 모듈 경계 위반 검사
- run: pnpm knip # 미사용 코드/의존성 검사
```

각 도구의 역할:

| 도구                | 검사 대상          | 실패 의미                         |
| ------------------- | ------------------ | --------------------------------- |
| `pnpm lint`         | 코드 품질/스타일   | 코딩 규칙 위반                    |
| `pnpm format:check` | 포매팅 일관성      | 포매터를 안 돌림                  |
| `pnpm sheriff`      | 모듈 간 의존 방향  | 아키텍처 경계 위반 (01 문서 참조) |
| `pnpm knip`         | 미사용 코드/의존성 | 죽은 코드 존재 (02 문서 참조)     |

**Result** — 빌드나 테스트보다 빠른 정적 분석으로 문제를 조기에 발견한다. 빌드에 3분 걸리는데 lint에서 이미 실패한다면 3분을 아낄 수 있다.

> **Caveat**: 현재 CI 워크플로(`ci.yml`)에는 sheriff와 knip 단계가 아직 포함되어 있지 않고, harness 레시피에만 정의되어 있다. 향후 CI에 추가할 때 Phase 2에 배치한다.

---

## Phase 3: typecheck, build, test — 컴파일과 런타임 검증

**Problem** — typecheck, build, test는 각각 독립적이지만 모두 codegen 결과에 의존한다. 순차 실행하면 피드백 시간이 길어진다.

**Action** — `nx run-many`로 세 태스크를 병렬 실행한다:

```yaml
- run: pnpm exec nx run-many -t typecheck build test
```

Nx는 프로젝트 간 의존 그래프를 분석하여 최적 순서로 병렬 실행한다:

- `typecheck`: tsc로 타입 검사 (output 없음, `noEmit: true`)
- `build`: Vite로 프로덕션 번들 생성
- `test`: Vitest로 단위/통합 테스트 실행

세 태스크 중 하나라도 실패하면 CI가 실패한다.

**Result** — 독립적인 검증을 병렬로 실행하여 CI 총 시간을 최소화하면서도, 모든 품질 게이트를 통과시킨다.

---

## Nx 태스크 오케스트레이션 — 새 프로젝트 자동 포함

**Problem** — 모노레포에 새 앱이나 패키지를 추가할 때마다 CI 파일을 수정해야 한다면, CI 설정이 프로젝트 구조와 동기화되지 않는 문제가 발생한다.

**Action** — `nx run-many`는 `package.json`의 `scripts` 필드를 기반으로 해당 태스크가 있는 모든 프로젝트를 자동 탐색한다:

```bash
# 모든 프로젝트에서 codegen 스크립트가 있는 것만 실행
pnpm exec nx run-many -t codegen

# 모든 프로젝트에서 typecheck, build, test 실행
pnpm exec nx run-many -t typecheck build test
```

새 패키지를 추가하고 `package.json`에 `typecheck` 스크립트를 넣으면, CI 변경 없이 자동으로 검증 대상에 포함된다.

**Result** — CI 설정이 프로젝트 수에 무관하게 안정적이다. 새 앱/패키지 추가 시 CI 파일 수정이 불필요하다. ✅ Nx 모노레포의 핵심 이점.

---

## 환경 설정 — treeless clone과 캐싱

**Problem** — 모노레포 전체를 clone하면 Git 히스토리와 blob이 무거워 CI 시작 시간이 길어진다. 의존성 설치도 매번 처음부터 하면 네트워크 비용이 크다.

**Action** — 두 가지 최적화를 적용한다:

```yaml
- uses: actions/checkout@v4
  with:
    filter: tree:0 # treeless clone: blob/tree를 필요 시에만 fetch
    fetch-depth: 0 # 전체 히스토리 (Nx affected 분석용)

- uses: actions/setup-node@v4
  with:
    node-version: 24
    cache: 'pnpm' # pnpm store 캐싱

- run: pnpm install --frozen-lockfile # lockfile 기준 결정론적 설치
```

| 설정                | 효과                                          |
| ------------------- | --------------------------------------------- |
| `filter: tree:0`    | 초기 clone 크기 대폭 감소                     |
| `fetch-depth: 0`    | 전체 커밋 히스토리 확보 (Nx affected 분석용)  |
| `cache: 'pnpm'`     | pnpm store를 GitHub Actions 캐시에 저장       |
| `--frozen-lockfile` | lockfile과 다른 의존성 설치 시도 시 즉시 실패 |

**Result** — CI 시작 시간이 단축되고, `--frozen-lockfile`으로 "CI에서만 다른 의존성이 설치되는" 문제를 차단한다.

---

## 이 프로젝트에서의 적용

| 결정                          | 해결하는 문제                               |
| ----------------------------- | ------------------------------------------- |
| codegen-first 순서            | 생성 코드 stale 상태에서 검증하는 오류 차단 |
| `git diff --exit-code` 게이트 | TypeSpec ↔ 생성물 불일치의 main 유입 차단   |
| 정적 분석 → 빌드/테스트 순서  | 빠른 실패로 CI 시간 절약                    |
| `nx run-many` 병렬 실행       | 프로젝트 추가 시 CI 변경 불필요 + 병렬 가속 |
| treeless clone + pnpm cache   | CI 시작 시간 최적화                         |

---

> **근거 문서**: [harness/06-tooling](../../harness/06-tooling.md)

---

## 이전 문서

[02. Sheriff — 모듈 경계 강제](./02-sheriff-module-boundaries.md) — 모노레포에서 패키지 간 의존 방향을 어떻게 강제하는가?
