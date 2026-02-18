# Notification Domain Data Model

## 문서 상태

- 본 문서는 **기존 PRD(01~05)에 미포함된 알림 도메인을 신규 정의**하기 위해 추가되었다.
- 데이터 개념 모델과 정책만 다루며 DB 컬럼 타입/인덱스 상세는 포함하지 않는다.

## 핵심 엔터티: Notification

- `type`
  - 알림 분류자(order, delivery, review 등)
  - UI 아이콘/문구 그룹핑 기준으로 사용
- `title`
  - 목록에서 즉시 의미를 전달하는 짧은 제목
- `body`
  - 상세 문맥(주문번호 일부, 상태 변화 요약 등)
- `read`
  - 읽음/미읽음 상태
  - 사용자 액션 또는 일괄 처리 API로 변경
- `created_at`
  - 알림 생성 시각
  - 목록 정렬의 기준 필드

## 보조 엔터티: NotificationPreference

- 사용자 단위 알림 수신 선호 설정
- MVP 기본값
  - in-app 수신: 활성
  - 외부 채널(push/email/SMS): 미사용 또는 비활성
- 확장 시나리오
  - 채널별 on/off
  - 이벤트 유형별 구독 여부

## 데이터 정책

- 소유권
  - Notification은 사용자 소유 데이터이며 교차 사용자 접근 금지
- 중복 방지
  - 동일 이벤트 재처리 시 중복 Notification 생성 금지
  - 이벤트 기반 멱등 키 전략은 `../13-event/01-overview.md`와 정합성 유지
- 보존
  - MVP에서는 최근 알림 중심 조회 정책을 우선하고 장기 보관 정책은 후속 정의

## 연관 도메인 매핑

- order 이벤트는 주문 생성/취소/완료 알림으로 매핑
- delivery 이벤트는 상태 전이(준비중, 배송중, 완료) 알림으로 매핑
- review 이벤트는 작성 요청/작성 완료 안내 알림으로 매핑

## 아키텍처 연계

- fanout 구조에서 notifications 큐 소비 결과로 Notification이 생성된다.
- 운영 신뢰성 기준은 `../13-event/01-overview.md`,
  구조적 근거는 `../../02-architecture/backend/04-eventing.adr.md`를 따른다.
