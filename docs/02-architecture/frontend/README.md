# Frontend Architecture

프론트엔드 계층은 사용자 인터페이스와 클라이언트 측 애플리케이션 아키텍처를 다룬다.
TanStack Start, React 19, Tailwind CSS v4를 기반으로 한 설계와 구현 가이드를 포함한다.

## 문서 목록

| 파일                                                                                             | 유형        | 설명                                                                    |
| ------------------------------------------------------------------------------------------------ | ----------- | ----------------------------------------------------------------------- |
| [01-frontend.md](./01-frontend.md)                                                               | 설계        | 프론트엔드 스택 개요: TanStack Start, React 19, Tailwind CSS            |
| [01-frontend.adr.md](./01-frontend.adr.md)                                                       | 의사결정    | 프론트엔드 스택 선택 근거 및 트레이드오프                               |
| [02-api-patterns.md](./02-api-patterns.md)                                                       | 패턴 가이드 | API 호출 패턴: Generated Client + Query Layer                           |
| [03-suspensive-boundaries.adr.md](./03-suspensive-boundaries.adr.md)                             | 의사결정    | Suspensive 선언적 경계 도입: isPending/isError → Suspense/ErrorBoundary |
| [04-callsite-readability.md](./04-callsite-readability.md)                                       | 패턴 가이드 | Call-site Readability: mutateAsync 흐름, 핸들러 네이밍, 중간 변수 제거  |
| [05-optimistic-updates.md](./05-optimistic-updates.md)                                           | 패턴 가이드 | Optimistic Updates: TQ Cache 기반 즉시 반영 + useOptimistic 비교        |
| [frontend-optimistic-updates 스킬](../../../.claude/skills/frontend-optimistic-updates/SKILL.md) | 스킬        | Optimistic 패턴: TQ Cache Imperative, useOptimistic, Hybrid             |
| [frontend-page-structure 스킬](../../../.claude/skills/frontend-page-structure/SKILL.md)         | 스킬        | pages/ 폴더 구조: 서비스별 응집도 중심 설계 가이드                      |
| [frontend-error-handling 스킬](../../../.claude/skills/frontend-error-handling/SKILL.md)         | 스킬        | 에러 처리 패턴: AsyncResult, tryCatchAsync, ErrorBoundary               |
| [frontend-testing 스킬](../../../.claude/skills/frontend-testing/SKILL.md)                       | 스킬        | 테스트 가이드라인: testable 함수 설계, given/when/then, vitest          |
| [typescript-patterns 스킬](../../../.claude/skills/typescript-patterns/SKILL.md)                 | 스킬        | TypeScript 패턴: PredefinedType, Discriminated Union, const object      |
| [frontend-style-layout 스킬](../../../.claude/skills/frontend-style-layout/SKILL.md)             | 스킬        | 스타일/레이아웃 패턴: Compound Pattern, 간격 관리, 반응형 이미지        |

## 빠른 네비게이션

### 설계 이해

- **프론트엔드 개요**: [01-frontend.md](./01-frontend.md)
- **pages/ 폴더 구조**: [frontend-page-structure 스킬](../../../.claude/skills/frontend-page-structure/SKILL.md)

### 패턴 가이드

- **API 호출 패턴**: [02-api-patterns.md](./02-api-patterns.md)
- **에러 처리 패턴**: [frontend-error-handling 스킬](../../../.claude/skills/frontend-error-handling/SKILL.md)
- **테스트 가이드라인**: [frontend-testing 스킬](../../../.claude/skills/frontend-testing/SKILL.md)
- **TypeScript 패턴**: [typescript-patterns 스킬](../../../.claude/skills/typescript-patterns/SKILL.md)
- **스타일/레이아웃 패턴**: [frontend-style-layout 스킬](../../../.claude/skills/frontend-style-layout/SKILL.md)
- **Call-site Readability**: [04-callsite-readability.md](./04-callsite-readability.md)
- **Optimistic Updates**: [05-optimistic-updates.md](./05-optimistic-updates.md)

### 의사결정 근거

- **프론트엔드 스택**: [01-frontend.adr.md](./01-frontend.adr.md)
- **Suspensive 경계 도입**: [03-suspensive-boundaries.adr.md](./03-suspensive-boundaries.adr.md)

## 관련 문서

- **기초 아키텍처**: [../base/README.md](../base/README.md)
- **백엔드 계층**: [../backend/README.md](../backend/README.md)
- **통합 계층**: [../integration/README.md](../integration/README.md)
- **아키텍처 메인**: [../README.md](../README.md)
- **ADR 인덱스**: [../README.md](../README.md)
