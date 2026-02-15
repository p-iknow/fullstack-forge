# 07. Operations and Readiness — Admin 운영 + 통합 검증

## Prerequisite

- [06-observability-and-events](./06-observability-and-events.md) 완료

## Roadmap Companion

- [roadmap/07-admin-and-operations](../roadmap/07-admin-and-operations.md)

## Harness 참조

- [03-frontend](../harness/03-frontend.md)
- [04-backend](../harness/04-backend.md)
- [05-integration](../harness/05-integration.md)

## 검증 체크리스트

### Admin 운영 플로우

- [ ] admin 화면에서 문의 상태 전이(`open → in_progress → resolved`) 경로 확인
- [ ] admin 화면에서 부적절 리뷰/댓글 숨김 처리 경로 확인
- [ ] admin 화면에서 주문 상태 전이(예: 준비중 → 배송중) 경로 확인

### 릴리즈 안정성

- [ ] canary 또는 blue-green 롤백 리허설 1회 수행 (목표: 60초 이내 롤백)

### 통합 검증 (한 줄)

```bash
pnpm exec nx run-many -t codegen && pnpm check && pnpm build && pnpm test
```

## Troubleshooting

### admin 권한 검증 실패

- 테스트 사용자의 역할이 `operator` 또는 `admin`인지 DB 확인
- 인증 미들웨어에서 역할 정보가 정상 전달되는지 확인
- `customer` 세션으로 admin API 호출 시 403이 아닌 다른 에러면 미들웨어 순서 확인

### 문의/리뷰 상태 전이 실패

- 현재 상태에서 대상 상태로의 전이가 허용된 경로인지 확인
  - 문의: `open → in_progress → resolved → closed`
  - 리뷰: `visible ↔ hidden` (operator/admin만)
- 요청 본문에 필수 필드(사유 코드 등)가 포함되었는지 확인

### 롤백 리허설 타임아웃

```bash
# 배포 상태 확인
kubectl rollout status deployment/repo-api --timeout=120s

# 이전 리비전으로 즉시 롤백
kubectl rollout undo deployment/repo-api

# Pod 상태 실시간 모니터링
kubectl get pods -l app=repo-api -w
```

## 향후 확장 (이번 범위 아님)

- API e2e 테스트 (`@hono/testing` 또는 supertest)
- TypeSpec 모델 분리 (`src/models/`, `src/routes/` 디렉토리)
- Kotlin/Go 서버 — `openapi.yaml`에서 `openapi-generator` / `oapi-codegen` 사용
- 환경변수 관리 (`.env` + Hono env helper)
- Hono 미들웨어 확장 (CORS, auth, rate limiting)
- DB 확장 (`read replica`, connection pool 튜닝, seed 전략)
- 로깅/트레이싱 (OpenTelemetry)
- Nx Cloud 원격 캐시
