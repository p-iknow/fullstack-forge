# 04. Docker Build and Runtime

## Step Objective

서비스를 컨테이너 이미지로 일관되게 빌드/실행하고,
로컬 개발 환경과 배포 전 검증 환경을 동일한 런타임 기준으로 맞춘다.

## Prerequisite

- [03-infra-foundation-and-networking](./03-infra-foundation-and-networking.md)

## References

- [04-backend](../harness/04-backend.md)
- [execution/04-docker-and-runtime](../execution/04-docker-and-runtime.md)

## Progressive Tasks

### 1) API Image Build Standard

- `apps/api` Dockerfile 빌드 기준 정리
- 런타임 env 주입 정책(`.env`/secret) 정의
- 이미지 태그 규칙(`local`, `sha`, `release`) 확정

### 2) Multi-Service Runtime

- store/admin/api/infra compose 실행
- 컨테이너 의존 순서 + health check 구성
- 데이터/세션 보존 정책 확인

### 3) Delivery Safety Loop

- 배포 전 smoke test 스크립트
- 빌드 실패 원인 분류표(의존성/네트워크/설정)
- 롤백 가능한 이미지 태그 운영 절차

## Local Environment Increment

- API 이미지를 로컬에서 빌드 후 compose로 즉시 기동해 실행 일치성 검증
- `.env` 변경 시 컨테이너 재기동 규칙을 문서화해 설정 누락 방지
- 로컬 기준 smoke test(login -> order -> health)를 이미지 단위로 반복

## Exit Criteria

- `pnpm --filter @fullstack-forge/api docker:build` 성공
- 컨테이너 실행 후 `/health` 정상
- compose 기반 핵심 사용자 흐름(login -> order) 성공

## Evidence

- build/run 로그
- smoke test 결과
- 이미지 태그/롤백 절차 문서

## Output for Next Step

- Kubernetes(05)에서 사용할 배포 아티팩트 준비 완료
- 관측/신뢰성 단계(06)에서 사용할 안정 실행 기반 확보
