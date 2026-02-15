# 05. Kubernetes Deploy and Release

## Step Objective

Kubernetes 매니페스트를 검증 가능한 형태로 운영하고,
배포 실패 시 즉시 복구 가능한 release/rollback 루프를 확립한다.

## Prerequisite

- [04-docker-build-and-runtime](./04-docker-build-and-runtime.md)

## References

- [04-backend](../harness/04-backend.md)
- [execution/05-kubernetes-deploy](../execution/05-kubernetes-deploy.md)

## Progressive Tasks

### 1) Manifest Baseline

- `Deployment`, `Service`, 필요 시 `ServiceMonitor` 작성
- readiness/liveness probe, resource request/limit 설정
- config/secret 분리 정책 확정

### 2) Release Strategy

- rollout 전략 1개 이상(canary 또는 blue-green)
- 롤백 트리거(오류율/지연/큐 적체) 명시
- 승인/검증/롤백 runbook 작성

### 3) Production Readiness Gate

- 배포 전 체크(typecheck/build/test + manifest validation)
- 배포 후 체크(health/metrics/error budget)
- 운영자 핸드오버 문서 정리

## Local Environment Increment

- minikube(또는 동등 로컬 클러스터)에서 동일 매니페스트를 우선 검증
- `kubectl apply --dry-run=server` -> 실제 apply -> readiness 확인을 기본 루프로 고정
- 로컬 롤백 리허설을 통해 배포 실패 대응 시간을 측정

## Exit Criteria

- `kubectl apply --dry-run=server` 통과
- Pod Ready + `/health`, `/metrics` 확인
- 롤백 절차를 타 운영자도 재현 가능

## Evidence

- kubectl 적용/검증 로그
- rollout/rollback 측정 기록
- 배포 게이트 체크리스트

## Output for Next Step

- 관측/신뢰성(06)에서 사용할 운영 임계치/릴리즈 기준 확보
- 운영 단계(07)에서 사용할 배포 안정성 기준 확보
