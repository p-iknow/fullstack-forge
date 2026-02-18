# Integration Architecture

통합 계층은 시스템 간 연동 설계를 다룬다.
API 계약의 기준은 `@fullstack-forge/api-spec`이며,
`openapi.yaml` 산출물과 생성 타입을 프론트/백엔드가 함께 소비하는 방식을 설명한다.
또한 이벤트 기반 아키텍처의 설계와 의사결정을 포함한다.

## 문서 목록

| 파일                                             | 유형     | 설명                                                           |
| ------------------------------------------------ | -------- | -------------------------------------------------------------- |
| [01-integration.md](./01-integration.md)         | 설계     | api-spec 기반 계약 동기화, 런타임 흐름, 검증 워크플로          |
| [01-integration.adr.md](./01-integration.adr.md) | 의사결정 | API 계약 기준을 api-spec(생성 원천: zod-openapi)로 채택한 근거 |

## 빠른 네비게이션

### 설계 이해

- **통합 개요**: [01-integration.md](./01-integration.md)

### 계약 기준 (api-spec)

- **패키지 기준/산출물 규칙**: [../base/03-packages.md](../base/03-packages.md)
- **통합 계층 codegen/검증 흐름**: [01-integration.md](./01-integration.md)

### 의사결정 근거

- **통합 설계**: [01-integration.adr.md](./01-integration.adr.md)

## 관련 문서

- **기초 아키텍처**: [../base/README.md](../base/README.md)
- **백엔드 계층**: [../backend/README.md](../backend/README.md)
- **프론트엔드 계층**: [../frontend/README.md](../frontend/README.md)
- **프론트 API 패턴**: [../frontend/02-api-patterns.md](../frontend/02-api-patterns.md)
- **아키텍처 메인**: [../README.md](../README.md)
