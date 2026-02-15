# 03. Infra Foundation and Networking

## Step Objective

로컬 환경에서 DB/Redis/메시지 브로커/프록시/모니터링의 기본 네트워크 경계를 확립해,
애플리케이션이 안정적으로 의존 인프라를 사용하도록 만든다.

## Prerequisite

- [02a-commerce-core-implementation](./02a-commerce-core-implementation.md)

## References

- [00-overview](../harness/00-overview.md)
- [05-integration](../harness/05-integration.md)
- [execution/03-infra-and-networking](../execution/03-infra-and-networking.md)

## Progressive Tasks

### 1) Local Service Baseline

- PostgreSQL, Redis, LocalStack(SNS/SQS), Nginx, Prometheus, Grafana 기본 구동
- `.env.example` 기준 환경 변수 정렬
- 서비스 포트/엔드포인트 표준화

### 2) Network Routing Baseline

- Nginx 진입점(`/`, `/ops/`, `/api/*`) 구성
- `X-Forwarded-*` 헤더 정책 적용
- 내부 우회 경로 정의(프록시 장애 대응)

### 3) Validation Loop Setup

- `docker compose` 기동/재기동 루프
- `kubeconform`, `kubectl apply --dry-run=server` 예비 검증 루프
- 인프라 연결 실패 원인 분류 기준 정리

## Local Environment Increment

- 로컬 compose에 API + PostgreSQL + Redis + LocalStack + Nginx를 최소 세트로 고정
- `localhost` 기준 포트 충돌 점검표를 만들고 팀 공통 값으로 유지
- `curl /health`, `curl /metrics`, `awslocal` 초기화 명령을 1회 루프로 자동화

## Exit Criteria

- API가 DB/Redis에 안정적으로 연결됨
- LocalStack topic/queue 초기화 가능
- 라우팅과 `/metrics` 수집이 재현 가능

## Evidence

- compose 실행 로그
- 라우팅 검증(`curl`) 결과
- 매니페스트 검증 명령 출력

## Output for Next Step

- Docker(04)에서 사용할 실행 토폴로지 확보
- Kubernetes(05)에서 재사용할 기준 환경 확보
