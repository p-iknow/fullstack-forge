# 05. Phased Delivery Plan (Implementation + Learning)

## 운영 원칙

- 각 단계는 `구현 목표 + 학습 목표 + 증빙(Evidence)`를 반드시 포함
- 단계 완료 조건(Exit Criteria) 미충족 시 다음 단계 진행 금지
- 단계 종료 시 `docs/roadmap/stage-<n>-notes.md` 기록 필수

## Stage 0 — Workspace and Baseline

### Entry Criteria

- 레포 clone 완료
- 필수 도구 설치(node/pnpm/docker)

### 구현 목표

- `store/admin/api` 실행 루프 확인
- codegen/build/typecheck 루프 안정화

### 학습 목표

- 모노레포 의존성 구조 이해
- spec-first 개발 흐름 이해

### Exit Criteria

- `pnpm typecheck` 통과
- `pnpm build` 통과
- 핵심 문서 경로 이해(README, 00, 07, PRD)

### Evidence

- 실행 명령 결과 요약
- 발견한 갭 리스트

## Stage 1 — Auth Foundation

### 구현 목표

- 이메일 로그인/로그아웃
- OAuth start/callback (google/kakao)
- 세션/토큰 정책 적용

### 학습 목표

- OAuth state/nonce 보안
- 세션 수명주기/rotation/reuse detection

### Exit Criteria

- 이메일 로그인/로그아웃 성공
- Google/Kakao callback 성공
- 변조 state 차단 테스트 통과
- 로그인 실패 잠금/rate limit 확인

### Evidence

- 인증 시퀀스 다이어그램
- 에러 코드 테스트 결과

## Stage 2 — Catalog and Cart

### 구현 목표

- 40~60 SKU 카탈로그
- 상품 목록/상세/검색(기본)
- 장바구니 기본 동작
- 상품 리뷰 요약/목록 조회(읽기)

### 학습 목표

- 카테고리/속성/상태 모델링
- mock 이미지 전략 적용
- 리뷰 노출/정렬/신뢰도(verified purchase) 기본 정책 이해

### Exit Criteria

- SKU 데이터 seed 완료
- store에서 상품 탐색/장바구니 동작
- out_of_stock 노출 정책 적용
- 상품 상세에서 리뷰 요약/목록 조회 성공

### Evidence

- SKU 정책표
- 이미지 naming 규칙 적용 스냅샷
- 리뷰 조회 API 응답 샘플

## Stage 3 — Order Core

### 구현 목표

- `POST /orders`, `GET /orders/:id`
- 주문 상태 모델과 전이 규칙 적용
- 배송 완료 주문 기반 리뷰 작성/수정 API
- 리뷰 댓글 작성 API

### 학습 목표

- 상태 전이 제약 설계
- 부분 품절/대체 처리 규칙
- 구매 검증 기반 UGC 생성 제어 정책

### Exit Criteria

- 주문 생성/조회 성공
- 불법 상태 전이 차단
- 대체상품 흐름 동작
- 비구매자 리뷰 작성 차단 + 구매자 리뷰 작성 성공
- 리뷰 댓글 작성/조회 성공

### Evidence

- 상태 전이 테스트 결과
- 실패 시나리오 로그
- 리뷰/댓글 권한 테스트 로그

## Stage 4 — Event Fanout

### 구현 목표

- `OrderCreated` 발행
- SQS fanout consumer 3개 처리

### 학습 목표

- pub/sub 설계와 소비자 분리
- 이벤트 계약(version/envelope)

### Exit Criteria

- 주문 1건 -> queue 3개 도착
- consumer 독립 처리 확인

### Evidence

- queue 수신 결과
- event envelope 샘플

## Stage 5 — Reliability

### 구현 목표

- idempotency key 적용
- DLQ/redrive 운영 루프 구축

### 학습 목표

- at-least-once 안전성 확보
- 장애 복구 runbook 운영

### Exit Criteria

- duplicate 이벤트 side-effect 0
- DLQ 이동 및 redrive 성공

### Evidence

- duplicate 테스트 기록
- redrive 실행 로그

## Stage 6 — Admin Operations

### 구현 목표

- admin에서 상태 전이, 실패 이벤트 관리
- SLA 위반 주문 운영 뷰 제공
- 고객 문의 inbox/상세/답변/상태 전이
- 리뷰 댓글/리뷰 숨김(모더레이션) 운영 기능

### 학습 목표

- 운영 UX 설계와 권한 정책
- 실무형 incident 대응 흐름
- 고객 커뮤니케이션 SLA(문의 응답) 운영 방식

### Exit Criteria

- admin 권한 정책 통과
- 운영자가 상태 전이/redrive 수행 가능
- 운영자가 문의 답변/상태 전이를 수행 가능
- 운영자가 부적절 리뷰/댓글을 숨김 처리 가능

### Evidence

- admin 플로우 스크린샷
- RBAC 검증 로그
- 문의 응답 SLA 측정 로그
- 리뷰 모더레이션 감사 로그

## Stage 7 — Observability and Hardening

### 구현 목표

- metrics/alerts/dashboard 완성
- rollback/drill(runbook) 수행
- 문의 응답 시간/리뷰 신고 처리율 지표 포함

### 학습 목표

- SLO/알림 임계치 설계
- 배포 실패 복구 전략

### Exit Criteria

- 핵심 지표 대시보드 확인
- 장애 drill 통과
- 롤백 기준 적용 확인

### Evidence

- 대시보드 캡처
- drill 리포트

## Stage Gate Checklist (공통)

각 Stage 종료 시 공통 체크:

- [ ] 요구사항 구현 완료
- [ ] 보안 정책 위반 없음
- [ ] 테스트/검증 결과 기록
- [ ] 실패 케이스 재현/복구 확인
- [ ] 다음 단계 리스크 정리
