# 00. Learning Roadmap Overview

이 문서는 `docs/prd`와 `docs/harness`를 기준으로, 학습과 구현을 하나의 점진적 흐름으로 정리한 로드맵의 기준점이다.

## 설계 원칙

- `docs/harness`: 구현 표준(아키텍처/스택/파일 기준)
- `docs/roadmap`: 학습 순서(무엇을 먼저 익히고 어떤 증빙으로 종료할지)
- 각 단계는 다음 단계의 입력을 만들어야 하며, 역순 의존을 두지 않는다.

## 점진 학습 순서

1. [01-db-design-and-migrations](./01-db-design-and-migrations.md)
2. [02-authentication-and-authorization](./02-authentication-and-authorization.md)
3. [02a-commerce-core-implementation](./02a-commerce-core-implementation.md)
4. [03-infra-foundation-and-networking](./03-infra-foundation-and-networking.md)
5. [04-docker-build-and-runtime](./04-docker-build-and-runtime.md)
6. [05-kubernetes-deploy-and-release](./05-kubernetes-deploy-and-release.md)
7. [06-observability-and-reliability](./06-observability-and-reliability.md)
8. [07-admin-and-operations](./07-admin-and-operations.md)

로컬 인프라 확장과 이벤트 통합 완료 조건은 01~07 단계에 분산 반영한다.

## 단계 간 산출물 연결

| 단계 | 핵심 산출물                                         | 다음 단계 입력 |
| ---- | --------------------------------------------------- | -------------- |
| 01   | 도메인 스키마 + migration 정책 + DB 로컬 부트스트랩 | 02, 02a        |
| 02   | 세션/OAuth/RBAC 정책 + Auth 로컬 검증 루프          | 02a, 07        |
| 02a  | 도메인 API + 프론트 연동 + 테스트 기반              | 03, 06, 07     |
| 03   | 로컬 인프라/네트워크 기준 + 메시징 초기화           | 04, 05         |
| 04   | 이미지/compose 실행 표준 + 통합 실행 검증           | 05, 06         |
| 05   | k8s 배포/롤백 기준 + 클러스터 로컬 실행 기준        | 06, 07         |
| 06   | 지표/알림/신뢰성 runbook + 이벤트 운영 검증         | 07             |
| 07   | 운영자 플로우 + incident/redrive 완료 증빙          | 종료           |

## PRD Stage 매핑

| PRD Stage                               | 로드맵 반영 |
| --------------------------------------- | ----------- |
| Stage 0 (Workspace/Baseline)            | 01, 03      |
| Stage 1 (Auth Foundation)               | 02          |
| Stage 2 (Catalog/Cart)                  | 01, 02a     |
| Stage 3 (Order + Review + Inquiry Core) | 02a         |
| Stage 4 (Event Fanout)                  | 03, 06      |
| Stage 5 (Reliability)                   | 06, 07      |
| Stage 6 (Admin Ops)                     | 07          |
| Stage 7 (Hardening)                     | 05, 06, 07  |

## 난이도/예상 소요시간 가이드

| 단계 | 난이도 | 예상 소요 | 핵심 학습 영역                             |
| ---- | ------ | --------- | ------------------------------------------ |
| 01   | ★★☆☆☆  | 2~3일     | DB 스키마 설계, migration 루프             |
| 02   | ★★★☆☆  | 3~5일     | OAuth, 세션 보안, RBAC                     |
| 02a  | ★★★★☆  | 5~7일     | 도메인 API, 상태 전이, 프론트 연동, 테스트 |
| 03   | ★★★☆☆  | 2~3일     | Docker compose, 서비스 네트워킹, 메시징    |
| 04   | ★★☆☆☆  | 1~2일     | Dockerfile, 이미지 빌드, 프로덕션 런타임   |
| 05   | ★★★☆☆  | 2~3일     | K8s 매니페스트, 배포/롤백                  |
| 06   | ★★★★☆  | 3~5일     | Prometheus, Grafana, 이벤트 신뢰성         |
| 07   | ★★★☆☆  | 2~3일     | Admin 운영, incident 대응, runbook         |

> 소요시간은 해당 기술 스택을 처음 다루는 경우 기준이며, 경험에 따라 단축 가능.

## 공통 종료 게이트

- 코드: `pnpm typecheck`, `pnpm build`, `pnpm test`
- 인프라: `docker compose`, `kubectl apply --dry-run=server`
- 보안: OAuth state/nonce, secure cookie, rate limit, RBAC
- 운영: 장애/복구/롤백 runbook + 증빙 로그

## 기준 문서

- 하네스 아키텍처: [00-overview](../harness/00-overview.md)
- 실행 체크리스트: [execution-index](../execution/README.md)
- 제품 요구사항(PRD): [prd-index](../prd/README.md)
