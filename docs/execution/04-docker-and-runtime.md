# 04. Docker and Runtime — Docker 빌드 + 컨테이너 실행 + 프로덕션

## Prerequisite

- [03-infra-and-networking](./03-infra-and-networking.md) 완료

## Roadmap Companion

- [roadmap/04-docker-build-and-runtime](../roadmap/04-docker-build-and-runtime.md)

## Harness 참조

- [04-backend](../harness/04-backend.md)

## 검증 체크리스트

### Docker 이미지 빌드

- [ ] `pnpm --filter @fullstack-forge/api docker:build` 이미지 빌드 성공
- [ ] `docker images repo-api:local` 이미지 확인
- [ ] 이미지 크기 확인 (불필요한 devDependencies 미포함)
- [ ] `docker history repo-api:local` 레이어 확인 (multi-stage 빌드 적용 여부)

### 컨테이너 단독 실행

- [ ] `pnpm --filter @fullstack-forge/api docker:run` 컨테이너 실행
- [ ] `curl http://localhost:8080/health` → `{"status":"ok"}`
- [ ] `curl http://localhost:8080/metrics` → Prometheus 메트릭 응답
- [ ] 환경변수(`.env`)가 컨테이너에 정상 주입 확인

### Compose 멀티 서비스 실행

- [ ] `docker compose up -d` (API + PostgreSQL + Redis) 기동 성공
- [ ] 컨테이너 의존 순서 확인 (`depends_on` + health check 동작)
- [ ] API 컨테이너에서 DB 연결 성공 (`/health`에서 DB 상태 반영)
- [ ] API 컨테이너에서 Redis 연결 성공
- [ ] compose 재기동(`docker compose restart`) 후 데이터 보존 확인 (volume 마운트)

### Smoke Test (핵심 사용자 흐름)

- [ ] 컨테이너 환경에서 `POST /auth/login` → 로그인 성공
- [ ] 컨테이너 환경에서 `POST /orders` → 주문 생성 성공
- [ ] 컨테이너 환경에서 `GET /orders/<id>` → 주문 조회 성공

### 프로덕션 빌드 실행

- [ ] `pnpm --filter @fullstack-forge/api build` → `apps/api/dist/index.mjs` 생성
- [ ] `node apps/api/dist/index.mjs` — 서버 실행 + `/health` 정상
- [ ] `pnpm --filter @fullstack-forge/store build` → `.output/` 생성
- [ ] `pnpm --filter @fullstack-forge/store start` — SSR 서버 실행
- [ ] `pnpm --filter @fullstack-forge/admin build && pnpm --filter @fullstack-forge/admin start` — 정상

### 이미지 태그 정책

- [ ] 로컬 태그(`local`), SHA 태그, 릴리즈 태그 규칙 정의
- [ ] 롤백 시 이전 태그로 재배포 가능 확인

## Troubleshooting

### 이미지 빌드 실패

- `pnpm install --frozen-lockfile` 단계 실패 시:
  - 로컬 `pnpm-lock.yaml`이 최신인지 확인
  - Dockerfile의 `COPY pnpm-lock.yaml` 경로가 빌드 context 기준인지 확인
- TypeScript 컴파일 에러 시:
  - 먼저 로컬에서 `pnpm typecheck` 통과 확인
  - codegen이 Dockerfile 내에서 실행되는지 확인

### 컨테이너에서 DB 연결 실패

- `DATABASE_URL`의 호스트가 컨테이너 네트워크 기준인지 확인
  - 로컬 직접 실행: `localhost`
  - compose 네트워크: 서비스명 (예: `postgres`)
- `pg_isready -h <host> -p 5432` 로 접속 가능 여부 확인
- compose의 `depends_on` + health check가 DB 준비를 기다리는지 확인

### 컨테이너에서 환경변수 누락

```bash
# 현재 컨테이너 환경변수 확인
docker exec <container> env | grep DATABASE_URL

# .env 파일이 docker run에 전달되는지 확인
docker run --rm --env-file .env repo-api:local env
```

### compose 재기동 시 데이터 손실

- PostgreSQL volume이 named volume인지 확인 (`volumes:` 섹션)
- 익명 volume은 `docker compose down` 시 삭제될 수 있음
- `docker volume ls`로 volume 존재 확인

## Next

- Kubernetes 배포 → [05-kubernetes-deploy](./05-kubernetes-deploy.md)
