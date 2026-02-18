# TypeScript 설정 심층 분석

이 프로젝트의 `tsconfig.base.json` / `tsconfig.json` 설정을 옵션 하나하나 분해하여,
**왜 이 옵션이 필요한지**, **2026년 기준으로 적절한지**, **이 프로젝트에서 어떤 역할인지** 를 설명한다.

> 기준 환경: TypeScript ~5.9.3 · pnpm workspaces · Nx · Vite(TanStack Start) · tsdown

## 문서 순서

| #   | 문서                                                                 | 핵심 질문                                                         |
| --- | -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 01  | [tsconfig 구조와 Solution-Style 패턴](./01-tsconfig-architecture.md) | 왜 `tsconfig.json`과 `tsconfig.base.json`으로 나누는가?           |
| 02  | [엄격성(Strictness) 옵션](./02-strictness-options.md)                | `strict` 하나면 충분한가? 추가 플래그는 왜 필요한가?              |
| 03  | [모듈 시스템 옵션](./03-module-system.md)                            | `module`, `moduleResolution`, `verbatimModuleSyntax` 등의 관계는? |
| 04  | [빌드와 출력 옵션](./04-build-and-output.md)                         | `noEmit`이면 tsc는 뭘 하는가? `skipLibCheck`은 왜 켜는가?         |
| 05  | [모노레포 전용: customConditions](./05-monorepo-customconditions.md) | 빌드 없이 라이브 타입이 되는 원리는?                              |

## 전제 지식

- TypeScript 기본 문법 (제네릭, 유틸리티 타입 수준)
- `package.json`의 `exports` 필드 개념
- 모노레포(monorepo)가 무엇인지

## 이 프로젝트의 설정 파일

```
루트/
├── tsconfig.base.json   ← 공유 컴파일러 옵션 (모든 패키지가 상속)
└── tsconfig.json        ← Solution-Style 진입점 (빌드 오케스트레이터)
```

## 연관 문서

- 설정 레시피: [architecture/base/02-foundation](../../02-architecture/base/02-foundation.md)
- 구현 표준 전체: [architecture/base/01-overview](../../02-architecture/base/01-overview.md)
