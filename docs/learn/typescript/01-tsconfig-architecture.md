# 01. tsconfig 구조와 Solution-Style 패턴

## 핵심 질문

> 왜 `tsconfig.json`과 `tsconfig.base.json` 두 파일로 나누는가?

## 한 줄 답

`tsconfig.base.json`은 **공유 컴파일러 옵션 금고**, `tsconfig.json`은 **빌드 오케스트레이터**. 역할이 다르다.

---

## Solution-Style tsconfig란?

TypeScript 공식 문서에서 권장하는 모노레포용 설정 패턴이다.

> *"Another good practice is to have a 'solution' tsconfig.json file that simply has references to all of your leaf-node projects and sets files to an empty array (otherwise the solution file will cause double compilation of files)."*
> — [TypeScript Handbook: Project References](https://www.typescriptlang.org/docs/handbook/project-references.html#guidance)

### 구조

```
루트/
├── tsconfig.base.json       ← 공유 옵션 정의
├── tsconfig.json            ← Solution 파일 (오케스트레이터)
├── apps/
│   └── store/
│       └── tsconfig.json    ← extends: ../../tsconfig.base.json
└── packages/
    └── shared/
        └── tsconfig.json    ← extends: ../../tsconfig.base.json
```

### 상속 흐름

```
tsconfig.base.json  ← 공통 옵션 (모든 패키지가 상속)
       ↑ extends
tsconfig.json       ← Solution 파일 (references로 프로젝트 연결)

apps/store/tsconfig.json ──extends──→ tsconfig.base.json
packages/shared/tsconfig.json ──extends──→ tsconfig.base.json
```

---

## 파일별 역할

### `tsconfig.base.json` — 공유 옵션 금고

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    // ... 모든 패키지가 공유할 옵션
  }
}
```

**역할:**
- 모든 워크스페이스 패키지가 `extends`로 상속하는 **단일 진실 공급원(Single Source of Truth)**
- 한 곳에서 수정하면 전체에 반영 (DRY 원칙)
- **자체로는 어떤 파일도 컴파일하지 않음** — 순수한 옵션 저장소

**왜 `tsconfig.json`에 직접 넣지 않는가?**
- Solution 파일(`tsconfig.json`)은 `references`와 `files: []`로 인해 특수한 역할을 함
- 개별 패키지가 Solution 파일을 extends하면 `files: []`과 `references`까지 상속되어 문제 발생
- 분리하면 **옵션 상속**과 **빌드 오케스트레이션**을 독립적으로 관리 가능

### `tsconfig.json` — Solution 파일 (빌드 오케스트레이터)

```jsonc
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {},   // 루트 전용 오버라이드 (현재 없음)
  "files": [],             // ★ 이중 컴파일 방지
  "references": []         // ★ 워크스페이스 프로젝트 연결 (현재 비어있음)
}
```

**역할:**
- `tsc --build` (`tsc -b`) 모드의 **진입점**
- `references`로 나열된 프로젝트를 의존성 순서대로 빌드
- **자체는 아무 파일도 컴파일하지 않음** (`files: []`)

---

## 핵심 옵션 해설

### `"files": []` — 이중 컴파일 방지

TypeScript 공식 문서가 Solution 파일에서 명시적으로 요구하는 설정.

**`files: []`가 없으면:**
```
tsc -b
├── tsconfig.json이 루트 디렉토리 파일 직접 컴파일 ← 1차
├── references[0] → apps/store 컴파일              ← 2차
└── 같은 파일이 두 번 컴파일됨 ❌
```

**`files: []`가 있으면:**
```
tsc -b
├── tsconfig.json은 파일 0개 컴파일 (오케스트레이터 전용) ← ✅
├── references[0] → apps/store 컴파일
└── references[1] → packages/shared 컴파일
```

### `"references": []` — 워크스페이스 프로젝트 연결

현재 비어있는 **플레이스홀더**. 워크스페이스 패키지가 생기면 채워진다:

```jsonc
"references": [
  { "path": "packages/api-spec" },
  { "path": "packages/shared" },
  { "path": "apps/store" },
  { "path": "apps/api" }
]
```

**Project References가 제공하는 것:**
- **증분 빌드** — 변경된 프로젝트만 다시 빌드
- **의존성 순서 보장** — `shared` → `api-spec` → `api` 순서로 빌드
- **논리적 분리 강제** — 패키지 간 순환 참조 방지
- **IDE 성능 향상** — 에디터가 전체 프로젝트 대신 현재 패키지만 분석

Nx는 라이브러리 생성 시 이 references를 자동 관리한다.

### `"compilerOptions": {}` — 루트 전용 오버라이드

현재 비어있지만, 루트에서만 필요한 옵션을 추가할 수 있다:

```jsonc
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    // 예: 루트 스크립트에서 Node 타입이 필요한 경우
    // "types": ["node"]
  }
}
```

---

## 왜 이 패턴이 모노레포에서 표준인가

| 장점 | 설명 |
|------|------|
| DRY | 컴파일러 옵션을 한 곳에서 관리 |
| 증분 빌드 | `tsc -b`가 변경분만 빌드 |
| IDE 성능 | 에디터가 현재 프로젝트 범위만 분석 |
| 경계 강제 | 패키지 간 의존성이 명시적 |
| 유연성 | 각 패키지가 base를 상속하면서 자기만의 옵션 추가 가능 |

### 실제 사례

- **TypeScript 자체** — `src/tsconfig-base.json` + `src/tsconfig.json` 패턴 사용
- **Grafana** — `scripts/tsconfig.base.json` + 루트 `tsconfig.json`
- **Nx 워크스페이스** — 생성 시 자동으로 이 패턴 구성

---

## 이 프로젝트에서의 적용

```jsonc
// tsconfig.base.json — 19개 옵션이 모든 패키지의 기준
{
  "compilerOptions": { /* ... 02~05 문서에서 상세 설명 */ }
}

// tsconfig.json — 순수 오케스트레이터
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {},
  "files": [],
  "references": []     // ← 패키지 생성 시 채워질 예정
}
```

현재 애플리케이션 코드가 없으므로 `references`가 비어있다.
`docs/execution/00-workspace-baseline.md`의 Step 0에서 첫 패키지 생성 시 채워진다.

---

## 2026.02 기준 적절성 평가

| 항목 | 평가 |
|------|------|
| Solution-Style 패턴 | ✅ TypeScript 공식 권장. 변한 것 없음 |
| `files: []` | ✅ Solution 파일의 필수 설정 |
| `references: []` | ✅ greenfield에서 정상적인 빈 플레이스홀더 |
| base/solution 분리 | ✅ 모노레포 사실상 표준 |

---

## 다음 문서

[02. 엄격성(Strictness) 옵션](./02-strictness-options.md) — `strict` 플래그 하나로 충분한가?
