# Base Architecture

기초 아키텍처는 전체 시스템의 기반이 되는 설계를 담고 있다.
개요부터 도구 선택까지 전체 스택의 설계와 의사결정을 다룬다.

## 문서 목록

| 파일                                                 | 유형     | 설명                                                      |
| ---------------------------------------------------- | -------- | --------------------------------------------------------- |
| [01-overview.md](./01-overview.md)                   | 설계     | 전체 아키텍처 개요, 스택 테이블, 설계 원칙, 디렉토리 구조 |
| [01-overview.adr.md](./01-overview.adr.md)           | 의사결정 | 아키텍처 개요 선택 근거 및 트레이드오프                   |
| [02-foundation.md](./02-foundation.md)               | 설계     | 기초 설정: 워크스페이스, 패키지 매니저, 린트/포맷         |
| [03-packages.md](./03-packages.md)                   | 설계     | 공용 패키지 구조: api-spec, shared, base-ui               |
| [04-tooling.md](./04-tooling.md)                     | 설계     | 도구 선택: 빌드, 테스트, 타입 검사                        |
| [08-observability.adr.md](./08-observability.adr.md) | 의사결정 | 관측성 스택 선택 근거 (Prometheus + Grafana)              |

## 빠른 네비게이션

### 설계 이해

- **전체 개요**: [01-overview.md](./01-overview.md)
- **기초 설정**: [02-foundation.md](./02-foundation.md)
- **패키지 구조**: [03-packages.md](./03-packages.md)
- **도구 선택**: [04-tooling.md](./04-tooling.md)

### 의사결정 근거

- **아키텍처 개요**: [01-overview.adr.md](./01-overview.adr.md)
- **관측성**: [08-observability.adr.md](./08-observability.adr.md)

## 관련 문서

- **백엔드 계층**: [../backend/README.md](../backend/README.md)
- **프론트엔드 계층**: [../frontend/README.md](../frontend/README.md)
- **통합 계층**: [../integration/README.md](../integration/README.md)
- **아키텍처 메인**: [../README.md](../README.md)
