# 06. Observability and Events — Monitoring + Event-driven 시나리오

## Prerequisite

- [05-kubernetes-deploy](./05-kubernetes-deploy.md) 완료

## Roadmap Companion

- [roadmap/06-observability-and-reliability](../roadmap/06-observability-and-reliability.md)

## Harness 참조

- [04-backend](../harness/04-backend.md)
- [06-tooling](../harness/06-tooling.md)

## 검증 체크리스트

### Monitoring (Prometheus + Grafana)

- [ ] `curl http://localhost:8080/metrics` 응답 확인
- [ ] `docker compose -f infra/monitoring/docker-compose.monitoring.yml up -d` 실행 성공
- [ ] Prometheus `http://localhost:9090` target up 확인
- [ ] Grafana `http://localhost:3000` 대시보드에서 API 요청 카운터 메트릭 확인 (예: `repo_api_http_requests_total`)

### Event-driven 시나리오 (SNS/SQS + Redis + Nginx)

- [ ] LocalStack 실행 중 (`localhost:4566`)
- [ ] `awslocal sns create-topic --name order-events` 성공
- [ ] fanout queue 3개(notifications/inventory/dispatch) 생성 및 topic 구독 확인
- [ ] `POST /orders` 후 각 queue에 메시지 도착 확인
- [ ] 동일 `eventId` 재전송 시 side-effect가 1회만 발생 (idempotency)
- [ ] worker 실패 시 DLQ 이동 확인 (`maxReceiveCount` 초과)
- [ ] redrive 후 정상 처리 복구 확인
- [ ] Nginx를 통해 `/`와 `/api/*` 동시 라우팅 확인
- [ ] Prometheus/Grafana에서 queue depth, 처리율, 실패율 지표 확인

## Troubleshooting

### Prometheus에서 target이 down

- API 서버의 `/metrics` 엔드포인트가 응답하는지 확인: `curl http://localhost:8080/metrics`
- `prometheus.yml`의 `targets` 주소 확인
  - Docker 환경: `host.docker.internal:8080`
  - K8s 환경: Service DNS 또는 ServiceMonitor 사용
- Prometheus 컨테이너에서 API 서버에 접근 가능한지 확인

### Grafana 대시보드에 데이터 없음

- Prometheus Data Source 설정 확인: `http://prometheus:9090` (compose 내부)
- Prometheus에서 메트릭이 수집되는지 확인: Prometheus UI → Status → Targets
- 시간 범위가 데이터 수집 기간을 포함하는지 확인

### idempotency 검증 실패

- Redis에 idempotency key가 저장되는지 확인: `redis-cli KEYS idempotency:*`
- key TTL이 테스트 시간보다 긴지 확인
- consumer 코드에서 key 조회 → side-effect 실행 → key 저장 순서 확인

### DLQ에 메시지 미도착

```bash
# DLQ 설정 확인
awslocal sqs get-queue-attributes \
  --queue-url http://localhost:4566/000000000000/notifications-queue \
  --attribute-names RedrivePolicy

# maxReceiveCount 확인 (기본 3~5회 초과 시 DLQ 이동)
```

### redrive 후 재처리 실패

- DLQ 메시지 payload 확인 후 원인 수정이 선행되었는지 확인
- idempotency key가 만료되었는지 확인 (만료 전이면 중복 처리로 skip)
- consumer 로그에서 에러 원인 확인

## Next

- 운영 + 통합 검증 → [07-operations-and-readiness](./07-operations-and-readiness.md)
