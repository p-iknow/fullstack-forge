# 05. 모노레포 전용: customConditions

## 핵심 질문

> `customConditions: ["@fullstack-forge/source"]`는 어떤 원리로 빌드 없는 라이브 타입을 가능하게 하는가?

## 한 줄 답

package.json `exports`에 커스텀 조건을 추가하여, TypeScript와 번들러가 **빌드 결과물 대신 소스 파일을 직접 참조**하게 만든다.

---

## 현재 설정

```jsonc
// tsconfig.base.json
{
  "compilerOptions": {
    "customConditions": ["@fullstack-forge/source"]
  }
}
```

---

## `"customConditions"` — 빌드 없는 라이브 타입

**Problem** — 모노레포에서 패키지 A가 패키지 B를 import하면, `exports`가 `./dist/index.js`를 가리키므로 B를 먼저 빌드해야 한다. 코드 수정할 때마다 빌드가 필요하고, HMR이 패키지 경계를 넘지 못한다:

```
apps/store에서 @fullstack-forge/shared를 import
  └── exports → ./dist/index.js
      └── 이 파일이 존재하려면 packages/shared를 먼저 빌드해야 함
```

**Action** — `exports`에 커스텀 조건을 추가하고, TypeScript와 Vite 양쪽에서 해당 조건을 활성화:

```jsonc
// packages/shared/package.json
{
  "exports": {
    ".": {
      "@fullstack-forge/source": "./src/index.ts",  // 개발: 소스 직접
      "types": "./dist/index.d.ts",                  // 프로덕션: 선언
      "import": "./dist/index.js"                    // 프로덕션: 빌드
    }
  }
}

// tsconfig.base.json
{ "customConditions": ["@fullstack-forge/source"] }

// vite.config.ts / vitest.config.ts
{ resolve: { conditions: ['@fullstack-forge/source'] } }
```

**Result** — 수정 즉시 반영(빌드 불필요), Go-to-Definition이 `.d.ts` 대신 원본 소스로 이동, 테스트 시 의존 패키지 빌드 불필요. Grafana(`@grafana-app/source`), Zod(`@zod/source`), Trigger.dev(`@triggerdotdev/source`) 등이 동일 패턴. ✅ 모던 모노레포의 핵심 패턴.

> **Caveat**: TypeScript(`customConditions`)와 런타임(`resolve.conditions`)에 **같은 조건을 설정**해야 한다. 불일치하면 "TypeScript는 타입 OK인데 런타임에서 모듈 못 찾음" 에러 발생. 프로덕션 빌드에서는 조건이 설정되지 않으므로 자동으로 빌드 결과물을 사용.

---

## 조건 이름에 `@fullstack-forge/` 접두사를 붙이는 이유

**Problem** — `source` 같은 일반적 이름을 쓰면, 외부 npm 패키지의 `exports`에 같은 조건이 있을 경우 그 패키지의 소스 파일을 의도치 않게 참조한다.

**Action** — 스코프 접두사를 붙여 우리 워크스페이스 패키지에서만 매칭되게 한다:

```
Grafana     → @grafana-app/source
Zod         → @zod/source
Trigger.dev → @triggerdotdev/source
이 프로젝트   → @fullstack-forge/source
```

**Result** — 외부 패키지와 충돌 불가. Colin McDonnell(Zod 저자)의 권고를 따른 패턴. ✅ 필수.

---

## 개발 vs 프로덕션 흐름

**Problem** — 개발 편의(소스 직접 참조)와 프로덕션 안전성(빌드 결과물 사용)을 동시에 만족해야 한다.

**Action** — 조건 매칭으로 자동 분기:

```
개발:
  TypeScript IDE + Vite dev → customConditions 매칭 → ./src/index.ts

프로덕션:
  Vite build (conditions 미설정) → 매칭 실패 → ./dist/index.js
  npm publish → 매칭 실패 → ./dist/index.js
```

**Result** — 설정 하나로 개발/프로덕션 자동 분기. 별도 관리 불필요. ✅ 올바른 설계.

---

## 이 프로젝트에서의 적용

| 옵션 | 해결하는 문제 |
|------|-------------|
| `customConditions` | 의존 패키지 빌드 없이 소스 직접 참조 (라이브 타입) |
| `@fullstack-forge/` 접두사 | 외부 패키지와의 조건 이름 충돌 방지 |

현재 상태: `customConditions`만 선언됨. 워크스페이스 패키지 생성 시 `exports`와 `resolve.conditions`가 함께 구성될 예정.

---

## 참고 자료

- [Colin McDonnell — Live types in a TypeScript monorepo](https://colinhacks.com/essays/live-types-typescript-monorepo)
- [TypeScript TSConfig — customConditions](https://www.typescriptlang.org/tsconfig/customConditions.html)
- [Nx — Testing Without Building Dependencies](https://nx.dev/docs/technologies/test-tools/vitest/guides/testing-without-building-dependencies)
