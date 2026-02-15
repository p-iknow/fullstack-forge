# Execution Guide

이 디렉토리는 `docs/harness`의 설계 기준과 `docs/roadmap`의 학습 경로를 **실행 가능한 검증 단위**로 분리한 것이다.

## 역할 구분

| 디렉토리         | 역할                             | 관점                   |
| ---------------- | -------------------------------- | ---------------------- |
| `docs/harness`   | 아키텍처/스택/파일 기준 (설계)   | 어떻게 만들어야 하는가 |
| `docs/roadmap`   | 학습 순서 + Exit Criteria (학습) | 무엇을 익혀야 하는가   |
| `docs/execution` | 셋업 + 검증 체크리스트 (실행)    | 제대로 동작하는가      |

## 문서 순서

| 실행 문서                                                       | 내용                                           | Roadmap 대응                                                    |
| --------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------- |
| [00-workspace-baseline](./00-workspace-baseline.md)             | 레포 초기화 + codegen + build + lint + quality | (harness 기반 사전 작업)                                        |
| [01-db-and-migrations](./01-db-and-migrations.md)               | DB 셋업 + migration + backup/restore           | [roadmap/01](../roadmap/01-db-design-and-migrations.md)         |
| [02-auth-and-security](./02-auth-and-security.md)               | 인증 검증 + 보안 기본선                        | [roadmap/02](../roadmap/02-authentication-and-authorization.md) |
| [02a-commerce-core](./02a-commerce-core.md)                     | 도메인 API + 프론트엔드 + 테스트               | [roadmap/02a](../roadmap/02a-commerce-core-implementation.md)   |
| [03-infra-and-networking](./03-infra-and-networking.md)         | Redis + proxy + 도메인 엔드포인트 연동         | [roadmap/03](../roadmap/03-infra-foundation-and-networking.md)  |
| [04-docker-and-runtime](./04-docker-and-runtime.md)             | Docker 빌드 + 컨테이너 실행 + 프로덕션         | [roadmap/04](../roadmap/04-docker-build-and-runtime.md)         |
| [05-kubernetes-deploy](./05-kubernetes-deploy.md)               | K8s 매니페스트 적용 + 배포 검증                | [roadmap/05](../roadmap/05-kubernetes-deploy-and-release.md)    |
| [06-observability-and-events](./06-observability-and-events.md) | Prometheus + Grafana + event-driven 시나리오   | [roadmap/06](../roadmap/06-observability-and-reliability.md)    |
| [07-operations-and-readiness](./07-operations-and-readiness.md) | Admin 운영 + 통합 검증 + production readiness  | [roadmap/07](../roadmap/07-admin-and-operations.md)             |

## 사용법

1. `00`부터 순서대로 진행 — 각 문서의 체크리스트를 모두 통과해야 다음 단계로 이동
2. 대응하는 `roadmap` 문서와 병행 — roadmap에서 개념을 학습하고, execution에서 검증
3. 각 문서의 `Troubleshooting`에서 빈번한 실패 원인과 해결 방법 확인

## 빠른 시작 (Fresh clone 최소 경로)

```bash
pnpm install
pnpm --filter @fullstack-forge/api-spec codegen
pnpm typecheck
pnpm --filter @fullstack-forge/api dev
pnpm --filter @fullstack-forge/store dev
```

문제 발생 시 [00-workspace-baseline](./00-workspace-baseline.md)의 `Troubleshooting` 참조.

## 통합 검증 (한 줄)

```bash
pnpm exec nx run-many -t codegen && pnpm check && pnpm build && pnpm test
```

## 연관 문서

- 하네스 아키텍처: [00-overview](../harness/00-overview.md)
- 제품 요구사항(PRD): [prd-index](../prd/README.md)
- 점진 로드맵: [roadmap-index](../roadmap/README.md)
