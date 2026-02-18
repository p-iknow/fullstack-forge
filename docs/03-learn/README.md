# Learn

프로젝트에서 사용하는 기술 스택의 근거와 동작 원리를 깊이 있게 정리하는 학습 문서 모음.

> `docs/architecture`가 "이렇게 설정하라"는 레시피라면, `docs/learn`은 "왜 이 설정인가"를 설명하는 교과서다.

## 구조

| 디렉토리                                                | 주제                                                   | 문서 수 |
| ------------------------------------------------------- | ------------------------------------------------------ | ------- |
| [typescript/](./typescript/README.md)                   | TypeScript 컴파일러 설정 심층 분석                     | 5       |
| [db-migrations/](./db-migrations/README.md)             | PostgreSQL·Drizzle 기반 DB 설계·마이그레이션·복구 루프 | 5       |
| [db-design-rationale/](./db-design-rationale/README.md) | 요구사항 기반 DB/테이블 설계 의사결정 근거             | 5       |
| [db-foundations/](./db-foundations/README.md)           | relation·FK·semantic key 입문                          | 4       |
| [package-manager/](./package-manager/README.md)         | pnpm 설정·hoisting·매니저 강제·sideEffects             | 4       |
| [api-spec/](./api-spec/README.md)                       | zod-openapi code-first 계약·OpenAPI/타입 소비          | 3       |
| [quality-tooling/](./quality-tooling/README.md)         | Knip·Sheriff·CI 파이프라인 품질 도구                   | 3       |
| [auth-login/](./auth-login/README.md)                   | Email/OAuth 로그인·세션·프론트 상태 동기화             | 6       |

## 문서 읽는 순서

1. 관심 주제의 `README.md`(인덱스)를 먼저 읽어 전체 지도를 파악
2. 번호 순서대로 진행 (앞 문서가 뒤 문서의 전제 지식)
3. 각 문서의 "이 프로젝트에서의 적용" 섹션으로 실무 연결

## 연관 문서

- 구현 표준(레시피): [architecture/](../02-architecture/base/01-overview.md)
- 실행 체크리스트(검증): [architecture/](../02-architecture/README.md)
