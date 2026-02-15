# 01. tsconfig 구조와 Solution-Style 패턴

## 핵심 질문

> 왜 `tsconfig.json`과 `tsconfig.base.json` 두 파일로 나누는가?

## 한 줄 답

`tsconfig.base.json`은 **공유 컴파일러 옵션 금고**, `tsconfig.json`은 **빌드 오케스트레이터**. 역할이 다르다.

---

## 현재 설정

```jsonc
// tsconfig.base.json — 공유 옵션
{
  "compilerOptions": { /* 02~05 문서에서 상세 설명 */ }
}

// tsconfig.json — Solution 파일
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {},
  "files": [],
  "references": []
}
```

---

## `tsconfig.base.json` / `tsconfig.json` 분리 — Solution-Style 패턴

**Problem** — 모노레포에서 tsconfig를 하나로 관리하면, 개별 패키지가 루트 설정을 `extends`할 때 `files: []`과 `references`까지 상속되어 의도치 않게 컴파일 대상이 0개가 되거나, 옵션 변경 시 어디에 영향이 가는지 파악이 불가능하다.

**Action** — TypeScript 공식 문서가 권장하는 Solution-Style 패턴으로 분리한다:

```
tsconfig.base.json  ← 공통 옵션 (모든 패키지가 extends)
tsconfig.json       ← Solution 파일 (references로 프로젝트 연결, 자체는 컴파일 안 함)

apps/store/tsconfig.json ──extends──→ tsconfig.base.json
packages/shared/tsconfig.json ──extends──→ tsconfig.base.json
```

**Result** — 한 곳에서 수정하면 전체에 반영(DRY). 개별 패키지는 Solution 파일의 `files: []`/`references` 영향 없이 base 옵션만 깔끔하게 상속. TypeScript 자체 저장소, Grafana, Nx 워크스페이스 등이 동일 패턴 사용. ✅ 2026.02 기준 모노레포 사실상 표준.

---

## `"files": []` — 이중 컴파일 방지

**Problem** — Solution 파일에 `files: []`가 없으면, 루트 디렉토리의 파일이 Solution 파일 + 개별 프로젝트 양쪽에서 이중 컴파일된다.

```
tsc -b (files: [] 없음)
├── tsconfig.json이 루트 파일 직접 컴파일 ← 1차
├── references[0] → apps/store 컴파일     ← 2차
└── 같은 파일이 두 번 처리됨
```

**Action** — `"files": []`로 설정하면 Solution 파일 자체는 어떤 파일도 컴파일하지 않는다.

```
tsc -b (files: [] 있음)
├── tsconfig.json은 파일 0개 (오케스트레이터 전용)
├── references[0] → apps/store 컴파일
└── references[1] → packages/shared 컴파일
```

**Result** — TypeScript 공식 문서에서 명시적으로 요구하는 설정. ✅ Solution 파일의 필수 요소.

---

## `"references": []` — 워크스페이스 프로젝트 연결

**Problem** — 모노레포에서 패키지 간 의존성이 명시적이지 않으면 빌드 순서가 보장되지 않고, 순환 참조를 잡을 수 없으며, IDE가 전체 프로젝트를 분석하여 느려진다.

**Action** — `references`로 워크스페이스 프로젝트를 연결한다. 현재는 패키지가 없으므로 빈 배열(플레이스홀더):

```jsonc
// 현재
"references": []

// 패키지 생성 후
"references": [
  { "path": "packages/api-spec" },
  { "path": "packages/shared" },
  { "path": "apps/store" }
]
```

**Result** — 증분 빌드(변경분만), 의존성 순서 보장, 순환 참조 방지, IDE 성능 향상. Nx가 라이브러리 생성 시 자동 관리. ✅ greenfield에서 정상적인 빈 플레이스홀더.

---

## 이 프로젝트에서의 적용

| 옵션               | 해결하는 문제                                          |
| ------------------ | ------------------------------------------------------ |
| base/solution 분리 | 옵션 상속과 빌드 오케스트레이션의 역할 혼재 방지       |
| `files: []`        | Solution 파일의 이중 컴파일 방지                       |
| `references: []`   | 패키지 간 의존성 명시 및 증분 빌드 (현재 플레이스홀더) |

---

## 다음 문서

[02. 엄격성(Strictness) 옵션](./02-strictness-options.md) — `strict` 플래그 하나로 충분한가?
