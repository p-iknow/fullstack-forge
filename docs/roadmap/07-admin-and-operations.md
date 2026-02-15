# 07. Admin and Operations

## Step Objective

운영자 관점에서 권한 통제, 상태 전이, 장애 복구를 하나의 운영 플로우로 정착시켜
실제 incident 대응 가능한 팀 실행력을 만든다.

## Prerequisite

- [02-authentication-and-authorization](./02-authentication-and-authorization.md)
- [06-observability-and-reliability](./06-observability-and-reliability.md)

## References

- [01-product-scope](../prd/01-product-scope.md)
- [03-commerce-domain-policy](../prd/03-commerce-domain-policy.md)

## Progressive Tasks

### 1) Role and Access Control in Operations

- `customer`, `operator`, `admin` 역할별 접근 경계 확정
- 운영 API 보호 미들웨어 적용
- 강제 상태 전이/redrive 권한 분리

### 2) Order Operations Workflow

- 주문 상태 전이 운영 엔드포인트/화면 구성
- 불법 전이 차단 + 사유 코드 표준화
- SLA 위반 주문 식별/처리 플로우 정리
- 고객 문의 inbox/답변/상태 전이 운영 플로우 구성
- 리뷰/댓글 모더레이션(숨김/복구) 운영 플로우 구성

### 3) Incident and Redrive Workflow

- redrive 절차(점검 -> 실행 -> 검증) 정착
- 장애 분류 기준(poison message, backlog, external failure)
- 운영 리포트 템플릿(원인/영향/조치/재발방지)

## Local Environment Increment

- 로컬 admin 환경에서 권한별 화면/API 접근을 반복 검증
- 로컬 장애 케이스에서 redrive를 실제로 수행하고 감사 로그까지 확인
- 운영 리포트 템플릿을 로컬 incident 기록으로 채워 종료 증빙으로 사용

## Exit Criteria

- customer의 admin 접근이 403으로 차단됨
- operator/admin 권한 범위가 테스트로 검증됨
- redrive 성공/실패 결과가 모두 감사 로그로 남음
- 문의 답변/상태 전이와 리뷰 모더레이션 이력이 감사 로그로 남음

## Evidence

- RBAC 테스트 로그
- admin 운영 플로우 캡처
- incident 리포트 샘플
- 문의 SLA 측정 로그 + 리뷰 모더레이션 로그

## Output for Next Step

- 로드맵 전체(01~07) 완료 증빙으로 운영 절차 확보
