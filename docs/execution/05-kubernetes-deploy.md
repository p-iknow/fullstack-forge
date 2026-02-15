# 05. Kubernetes Deploy — K8s 매니페스트 적용 + 배포 검증

## Prerequisite

- [04-docker-and-runtime](./04-docker-and-runtime.md) 완료

## Roadmap Companion

- [roadmap/05-kubernetes-deploy-and-release](../roadmap/05-kubernetes-deploy-and-release.md)

## Harness 참조

- [04-backend](../harness/04-backend.md)

## 검증 체크리스트

### 로컬 클러스터 준비

- [ ] minikube (또는 동등 로컬 클러스터) 실행 중
- [ ] `kubectl cluster-info` 정상 응답
- [ ] API 이미지가 클러스터에서 접근 가능 (`minikube image load repo-api:local` 또는 레지스트리 push)

### 매니페스트 검증 (Dry-run)

- [ ] `kubectl apply --dry-run=server -f apps/api/k8s/api-deployment.yaml` 통과
- [ ] `kubectl apply --dry-run=server -f apps/api/k8s/api-servicemonitor.yaml` 통과
- [ ] `kubeconform -strict -summary apps/api/k8s/*.yaml` 통과 (선택)

### 배포 + Pod 상태

- [ ] `kubectl apply -f apps/api/k8s/api-deployment.yaml` 적용 성공
- [ ] `kubectl get pods -l app=repo-api` — Pod Status: Running
- [ ] `kubectl describe pod <pod-name>` — Events에 에러 없음
- [ ] readiness probe 통과 확인 (`kubectl get endpoints`)
- [ ] liveness probe 설정 확인 (`/health` 경로)

### 서비스 접근 확인

- [ ] `kubectl port-forward svc/repo-api 8080:8080`
- [ ] `curl http://localhost:8080/health` → `{"status":"ok"}`
- [ ] `curl http://localhost:8080/metrics` → Prometheus 메트릭 응답

### 리소스/설정 검증

- [ ] resource requests/limits 설정 확인 (`kubectl describe deployment repo-api`)
- [ ] ConfigMap/Secret 분리 정책 확인 (환경변수가 하드코딩되지 않음)
- [ ] replica 수 조정 → Pod 자동 확장 확인

### Prometheus Operator 연동 (선택)

- [ ] `kubectl apply -f apps/api/k8s/api-servicemonitor.yaml` 적용 성공
- [ ] Prometheus target 목록에서 repo-api 확인

### 롤백 리허설

- [ ] 의도적 오류 이미지 배포 (`imagePullBackOff` 또는 readiness 실패 유도)
- [ ] `kubectl rollout undo deployment/repo-api` 롤백 실행
- [ ] 롤백 후 `/health` 정상 확인
- [ ] 전체 소요시간 기록 (목표: 60초 이내)

## Troubleshooting

### Pod CrashLoopBackOff

- `kubectl logs <pod-name>` 로 에러 확인
- 환경변수 누락 확인: `kubectl exec <pod-name> -- env`
- DB/Redis 연결 가능 여부: Pod 내부에서 `nslookup <service-name>` 또는 `nc -zv <host> <port>`

### ImagePullBackOff

- minikube 사용 시: `minikube image load repo-api:local` 실행 여부 확인
- 이미지 이름/태그가 매니페스트와 일치하는지 확인
- `imagePullPolicy: IfNotPresent` 설정 확인 (로컬 이미지 사용 시)

### Readiness Probe 실패

- probe 경로(`/health`)가 실제 라우트와 일치하는지 확인
- `initialDelaySeconds`가 앱 기동 시간보다 긴지 확인
- Port 번호가 컨테이너 포트와 일치하는지 확인

### Service에 Endpoint 없음

- Pod label과 Service selector가 일치하는지 확인
- `kubectl get endpoints repo-api` — 주소가 비어있으면 Pod가 Ready가 아님
- readiness probe 통과 여부 재확인

### 롤백 실패

```bash
# 배포 이력 확인
kubectl rollout history deployment/repo-api

# 특정 리비전으로 롤백
kubectl rollout undo deployment/repo-api --to-revision=<N>

# 롤백 상태 확인
kubectl rollout status deployment/repo-api
```

## Next

- 관측 + 이벤트 → [06-observability-and-events](./06-observability-and-events.md)
