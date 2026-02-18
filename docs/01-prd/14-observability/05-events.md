# Observability Domain Events Stub

## 정책

- 관측 도메인은 이벤트 발행 없음.
- 관측 도메인은 API/Worker/Event 처리 결과를 지표와 감사 로그로 수집/조회한다.
- 이벤트 엔벨로프 공통 규격은 `../13-event/01-overview.md`를 참조한다.

## 설명

- observability는 producer가 아니라 수집/시각화/알림/감사 역할에 집중한다.
- 도메인 이벤트의 생성/전파 책임은 event 및 각 비즈니스 도메인에 있다.
