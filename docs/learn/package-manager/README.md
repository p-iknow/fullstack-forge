# pnpm 패키지 매니저 심층 분석

이 프로젝트의 `.npmrc` / `pnpm-workspace.yaml` / `package.json` 설정을 하나하나 분해하여,
**왜 이 설정이 필요한지**, **2026년 기준으로 적절한지**, **이 프로젝트에서 어떤 역할인지** 를 설명한다.

> 기준 환경: pnpm 10.5.2 · Node.js 22 · pnpm workspaces · Nx · Corepack

## 문서 순서

| #   | 문서                                                      | 핵심 질문                                                                             |
| --- | --------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 01  | [pnpm 설정 파일 체계](./01-pnpm-config-files.md)          | `.npmrc`, `pnpm-workspace.yaml`, `package.json`의 `pnpm` 필드 — 각각 뭘 담당하는가?   |
| 02  | [Hoisting 전략](./02-hoisting-strategy.md)                | `shamefully-hoist`, `hoist-pattern`, `public-hoist-pattern` — 왜 기본값으로 충분한가? |
| 03  | [패키지 실행 명령어](./03-package-execution-commands.md)  | `npx` vs `pnpm exec` vs `pnpm dlx` — 언제 어떤 걸 쓰는가?                             |
| 04  | [패키지 매니저 강제](./04-package-manager-enforcement.md) | 팀원이 npm이나 yarn을 실수로 쓰는 걸 어떻게 막는가?                                   |

## 전제 지식

- `package.json`의 기본 구조 (`scripts`, `dependencies`, `devDependencies`)
- npm, yarn, pnpm의 차이점 개략적 이해
- 모노레포(monorepo)가 무엇인지

## 이 프로젝트의 설정 파일

```
루트/
├── .npmrc                 ← 런타임 동작 (v10 기본값 사용, 주석만)
├── pnpm-workspace.yaml    ← 워크스페이스 패키지 + catalog (버전 중앙 관리)
└── package.json           ← packageManager + pnpm.onlyBuiltDependencies
```

## 연관 문서

- 설정 레시피: [harness/01-foundation](../../harness/01-foundation.md)
- 구현 표준 전체: [harness/00-overview](../../harness/00-overview.md)
