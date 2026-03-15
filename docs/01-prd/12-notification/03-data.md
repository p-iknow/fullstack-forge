# Notification Domain Data Model

## 문서 상태

- 본 문서는 **기존 PRD(01~05)에 미포함된 알림 도메인을 신규 정의**하기 위해 추가되었다.

## 핵심 엔터티: Notification

| 필드              | 타입          | 필수 | 제약조건                             | 설명                                                  |
| ----------------- | ------------- | ---- | ------------------------------------ | ----------------------------------------------------- |
| `id`              | UUID          | Y    | PK                                   | 알림 식별자                                           |
| `user_id`         | UUID          | Y    | FK → User, INDEX                     | 알림 소유 사용자 식별자                               |
| `source_event_id` | UUID          | Y    | UNIQUE(`user_id`, `source_event_id`) | 원본 이벤트 `eventId`. 멱등 알림 생성 보장            |
| `type`            | string (enum) | Y    | 아래 enum 참조                       | 알림 분류자. UI 아이콘/문구 그룹핑 기준               |
| `title`           | string        | Y    | 최대 100자                           | 목록에서 즉시 의미를 전달하는 짧은 제목               |
| `body`            | string        | Y    | 최대 500자                           | 상세 문맥 (주문번호, 상태 변화 요약 등)               |
| `link_target`     | string        | N    | 최대 500자                           | 클릭 시 이동할 딥링크 경로 (예: `/orders/{order_id}`) |
| `read_at`         | timestamp     | N    | nullable                             | 최초 읽음 시각. null이면 미읽음 상태                  |
| `created_at`      | timestamp     | Y    | DEFAULT NOW, INDEX                   | 알림 생성 시각. 목록 정렬 기준 필드                   |

### `type` enum 값

| 값          | 설명                              | 원본 이벤트 예시                                                                                                |
| ----------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `order`     | 주문 생성/상태 변경/취소/대체상품 | `OrderCreated`, `OrderStatusChanged`, `OrderCancelled`, `SubstitutionRequested`, `SubstitutionResolved`         |
| `payment`   | 결제 완료/실패/취소/환불          | `PaymentCaptured`, `PaymentFailed`, `PaymentCancelled`, `PaymentRefunded`                                       |
| `delivery`  | 배송 준비/배차/상태 변경/취소     | `DeliveryCreated`, `DeliveryDispatched`, `DeliveryStatusChanged`, `DeliveryDispatchFailed`, `DeliveryCancelled` |
| `review`    | 리뷰 작성 가능/등록 완료          | `ReviewEligible`, `ReviewCreated`                                                                               |
| `inventory` | 관심 상품 품절/재입고             | `InventoryLevelChanged`                                                                                         |
| `cart`      | 장바구니 만료/주문 전환           | `CartExpired`, `CartConverted`                                                                                  |
| `loyalty`   | 포인트 적립/사용/만료/조정        | `PointsEarned`, `PointsRedeemed`, `PointsExpired`, `PointsAdjusted`                                             |
| `promotion` | 프로모션 할인 적용                | `PromotionApplied`                                                                                              |
| `inquiry`   | 문의 접수/답변/상태 변경/재오픈   | `InquiryCreated`, `InquiryReplied`, `InquiryStatusChanged`, `InquiryReopened`                                   |

### 파생/계산 필드

| 필드      | 계산 방식             | 용도               |
| --------- | --------------------- | ------------------ |
| `is_read` | `read_at IS NOT NULL` | 읽음/미읽음 필터링 |

### 유니크 제약 및 인덱스

| 제약/인덱스 | 대상 필드                     | 설명                              |
| ----------- | ----------------------------- | --------------------------------- |
| UNIQUE      | `user_id` + `source_event_id` | 동일 이벤트에 대한 중복 알림 방지 |
| INDEX       | `user_id` + `created_at DESC` | 사용자별 최신순 목록 조회 최적화  |
| INDEX       | `user_id` + `read_at`         | 미읽음 필터링 최적화              |

## 보조 엔터티: NotificationPreference

| 필드             | 타입      | 필수 | 제약조건          | 설명                              |
| ---------------- | --------- | ---- | ----------------- | --------------------------------- |
| `id`             | UUID      | Y    | PK                | 설정 식별자                       |
| `user_id`        | UUID      | Y    | FK → User, UNIQUE | 사용자 식별자 (1:1 관계)          |
| `in_app_enabled` | boolean   | Y    | DEFAULT true      | in-app 알림 수신 여부             |
| `push_enabled`   | boolean   | Y    | DEFAULT false     | push 알림 수신 여부 (MVP 미사용)  |
| `email_enabled`  | boolean   | Y    | DEFAULT false     | email 알림 수신 여부 (MVP 미사용) |
| `created_at`     | timestamp | Y    | DEFAULT NOW       | 설정 생성 시각                    |
| `updated_at`     | timestamp | Y    | DEFAULT NOW       | 설정 변경 시각                    |

- MVP에서는 `in_app_enabled`만 활성. 외부 채널 필드는 확장을 위해 미리 정의하되 기본값 `false`
- 이벤트 유형별 세분화 구독(예: loyalty 알림만 off)은 MVP 후 확장 범위

## 데이터 정책

### 소유권

- Notification은 사용자 소유 데이터이며 교차 사용자 접근 금지
- API 레벨에서 `user_id` 필터 강제 적용

### 중복 방지

- 동일 이벤트 재처리 시 중복 Notification 생성 금지
- `source_event_id` 유니크 제약으로 DB 레벨에서 보장
- 이벤트 기반 멱등 키 전략은 `../13-event/01-overview.md`와 정합성 유지

### 보존

- MVP 보존 기간: **90일**
- 90일 경과 알림은 배치 작업으로 soft delete 처리
- soft delete 시 `deleted_at` 타임스탬프 기록 (향후 필요 시 복구 가능)
- 사용자당 최대 조회 범위: 최근 90일 이내, 삭제되지 않은 알림

### 감사 필드

- `created_at`: 알림 생성 시각 (이벤트 소비 완료 시점)
- `read_at`: 최초 읽음 시각 (사용자 액션 시점)
- 별도 `updated_at` 미사용 (읽음 처리만 가능하므로 `read_at`이 변경 이력 역할)

## 연관 도메인 매핑

| 도메인    | 이벤트 → 알림 매핑                           |
| --------- | -------------------------------------------- |
| order     | 주문 생성/상태 변경/취소/대체상품 알림       |
| payment   | 결제 완료/실패/취소/환불 알림                |
| delivery  | 배송 준비/배차/상태 변경/배차 지연/취소 알림 |
| review    | 리뷰 작성 가능/등록 완료 알림                |
| inventory | 품절/재입고 고객 알림                        |
| cart      | 장바구니 만료/주문 전환 알림                 |
| loyalty   | 포인트 적립/사용/만료/조정 알림              |
| promotion | 카테고리 할인 적용 알림                      |
| inquiry   | 문의 접수/답변/상태 변경/재오픈 알림         |

## 아키텍처 연계

- fanout 구조에서 notifications 큐 소비 결과로 Notification이 생성된다.
- 운영 신뢰성 기준은 `../13-event/01-overview.md`,
  구조적 근거는 `../../02-architecture/backend/02-eventing.adr.md`를 따른다.
