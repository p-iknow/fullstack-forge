# 03. Infra and Networking — Redis + Proxy + 도메인 엔드포인트 연동

## Prerequisite

- [02a-commerce-core](./02a-commerce-core.md) 완료

## Roadmap Companion

- [roadmap/03-infra-foundation-and-networking](../roadmap/03-infra-foundation-and-networking.md)

## Harness 참조

- [04-backend](../harness/04-backend.md)
- [05-integration](../harness/05-integration.md)
- [03-frontend](../harness/03-frontend.md)

## 검증 체크리스트

### Cache (Redis)

- [ ] Redis 실행 중 (`localhost:6379` 또는 `REDIS_URL` 대상)
- [ ] `POST /auth/login` 성공 후 세션 캐시 생성 확인
- [ ] `redis-cli GET auth:session:<user-id>` 값 확인

### 도메인 API 엔드포인트

- [ ] `curl -X POST http://localhost:8080/orders` → 주문 생성 + 이벤트 발행
- [ ] `curl http://localhost:8080/orders/<id>` → 주문 상태 조회
- [ ] `curl -X POST http://localhost:8080/reviews` → 리뷰 생성(구매 검증 사용자)
- [ ] `curl -X POST http://localhost:8080/reviews/<id>/comments` → 리뷰 댓글 생성
- [ ] `curl -X POST http://localhost:8080/inquiries` → 문의 생성
- [ ] `curl http://localhost:8080/inquiries/<id>` → 문의 조회
- [ ] 리뷰/댓글/문의 endpoint rate limit 적용 확인 (`POST /reviews`, `POST /reviews/:id/comments`, `POST /inquiries`)

### 프론트엔드 Proxy 연동

- [ ] `http://localhost:3001/api/auth/me` → proxy 동작 확인
- [ ] `http://localhost:3001/api/orders/<id>` → proxy 동작 확인
- [ ] `http://localhost:3001/api/products/<id>/reviews` → 리뷰 목록 proxy 동작 확인

### 프론트엔드 UX 검증

- [ ] 로그인 화면 첫 진입 시 Suspense fallback 노출 후 세션 렌더링 확인
- [ ] 동일 화면 재진입 시 TanStack Query 캐시 hit 확인

## Troubleshooting

### Redis 연결 실패

- Redis 컨테이너 실행 중인지 확인: `docker ps | grep redis`
- 포트 충돌 확인: `lsof -i :6379`
- `REDIS_URL` 환경변수 값 확인: `redis://localhost:6379`

### LocalStack SNS/SQS 초기화 실패

```bash
# LocalStack 상태 확인
curl http://localhost:4566/_localstack/health

# topic/queue 수동 생성
awslocal sns create-topic --name order-events
awslocal sqs create-queue --name notifications-queue
awslocal sqs create-queue --name inventory-queue
awslocal sqs create-queue --name dispatch-queue
```

### Nginx proxy 라우팅 실패

- Nginx 설정에서 `upstream` 주소가 API 서버 주소와 일치하는지 확인
- `docker logs <nginx-container>` 에서 에러 확인
- `/api/*` 라우팅 규칙의 `proxy_pass` 대상 확인

### 프론트엔드 proxy와 Nginx proxy 혼동

- 개발 환경: Vite dev proxy (`vite.config.ts`의 `server.proxy`)
- 프로덕션/compose 환경: Nginx reverse proxy
- 두 설정이 동시에 동작하면 충돌 가능 → 환경별 구분 필요

## Next

- Docker + 런타임 → [04-docker-and-runtime](./04-docker-and-runtime.md)
