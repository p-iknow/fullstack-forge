# 품질 도구 심층 분석

이 프로젝트의 `knip.json` / `sheriff.config.ts` / `.github/workflows/ci.yml` 설정을 하나하나 분해하여,
**왜 이 설정이 필요한지**, **2026년 기준으로 적절한지**, **이 프로젝트에서 어떤 역할인지** 를 설명한다.

> 기준 환경: Knip 5 · Sheriff (`@softarc/sheriff-core`) · Nx · pnpm workspaces · GitHub Actions

## 문서 순서

| #   | 문서                                                              | 핵심 질문                                                              |
| --- | ----------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 01  | [Knip — 미사용 코드·의존성 탐지](./01-knip-unused-detection.md)   | 모노레포에서 미사용 의존성, 미사용 export, 죽은 파일을 어떻게 자동으로 잡아내는가? |
| 02  | [Sheriff — 모듈 경계 강제](./02-sheriff-module-boundaries.md)     | 모노레포에서 패키지 간 의존 방향을 어떻게 강제하는가?                   |
| 03  | [CI 파이프라인 — codegen-first 검증 전략](./03-ci-pipeline.md)    | knip, sheriff, typecheck, build, test를 CI에서 어떤 순서로 실행해야 하는가? |

## 전제 지식

- 모노레포(monorepo)의 워크스페이스 개념
- `import`/`export` 기반 모듈 시스템
- CI/CD 파이프라인 기본 개념

## 이 프로젝트의 설정 파일

```text
루트/
├── knip.json                          ← 미사용 코드·의존성 탐지 설정
├── sheriff.config.ts                  ← 모듈 경계·의존 규칙 설정
└── .github/workflows/ci.yml          ← CI 파이프라인 (codegen-first)
```

## 연관 문서

- 설정 레시피: [harness/06-tooling](../../harness/06-tooling.md)
- 구현 표준 전체: [harness/00-overview](../../harness/00-overview.md)
- 실행 체크리스트: [execution/06-quality-tooling](../../execution/06-quality-tooling.md)
