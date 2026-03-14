# Review Events

## 1) 도메인 이벤트 최소 범위 (PRD §1 원문)

- 리뷰/댓글: `ReviewEligible`, `ReviewCreated`, `ReviewCommentCreated`, `ReviewHiddenByOperator`

## 2) 이벤트 목록 및 페이로드

### `ReviewEligible`

배송 완료 후 리뷰 작성 가능 시점에 발행한다. `DeliveryStatusChanged`(`new_status=delivered`) 소비 결과로 해당 주문의 리뷰 미작성 아이템에 대해 발행.

- **멱등성 키**: `ReviewEligible:{order_id}`

| 필드           | 타입       | 설명                          |
| -------------- | ---------- | ----------------------------- |
| `order_id`     | `string`   | 배송 완료된 주문 ID           |
| `user_id`      | `string`   | 주문자 ID                     |
| `order_items`  | `array`    | 리뷰 작성 가능 아이템 목록    |
| `order_items[].order_item_id` | `string` | 주문 아이템 ID     |
| `order_items[].product_id`    | `string` | 상품 ID            |
| `eligible_at`  | `datetime` | 리뷰 작성 가능 시각           |

#### 소비자

| 소비 도메인 | 용도 |
| --- | --- |
| `notification` | 리뷰 작성 유도 알림 발송 (`../12-notification/05-events.md`) |

### `ReviewCreated`

리뷰가 최초 생성되었을 때 발행한다.

| 필드          | 타입       | 설명                      |
| ------------- | ---------- | ------------------------- |
| `review_id`   | `string`   | 생성된 리뷰 ID            |
| `product_id`  | `string`   | 대상 상품 ID              |
| `user_id`     | `string`   | 작성자 ID                 |
| `rating`      | `integer`  | 평점 (`1..5`)             |
| `image_count` | `integer`  | 첨부 이미지 수 (`0..5`)   |
| `created_at`  | `datetime` | 생성 시각                 |

### `ReviewCommentCreated`

리뷰에 댓글이 추가되었을 때 발행한다.

| 필드         | 타입       | 설명           |
| ------------ | ---------- | -------------- |
| `comment_id` | `string`   | 생성된 댓글 ID |
| `review_id`  | `string`   | 대상 리뷰 ID   |
| `user_id`    | `string`   | 작성자 ID      |
| `created_at` | `datetime` | 생성 시각      |

### `ReviewHiddenByOperator`

운영자가 리뷰를 숨김 처리했을 때 발행한다.

| 필드          | 타입       | 설명                |
| ------------- | ---------- | ------------------- |
| `review_id`   | `string`   | 숨김 처리된 리뷰 ID |
| `operator_id` | `string`   | 처리 운영자 ID      |
| `reason`      | `string`   | 숨김 사유           |
| `hidden_at`   | `datetime` | 숨김 처리 시각      |

## 3) 소비자 요약

| 이벤트 | 소비 도메인 | 용도 |
| --- | --- | --- |
| `ReviewEligible` | notification | 리뷰 작성 유도 알림 발송 |
| `ReviewCreated` | notification | 리뷰 등록 완료 알림 발송 |
| `ReviewCreated` | observability | 리뷰 작성 전환율 메트릭 수집 |
| `ReviewHiddenByOperator` | observability | 모더레이션 처리율 메트릭 수집 |

## 4) 소비 이벤트 (Consumed Events)

review 도메인이 다른 도메인에서 수신하여 처리하는 이벤트 목록.

| 소스 도메인 | 이벤트 | 처리 내용 | 소스 문서 |
| --- | --- | --- | --- |
| `delivery` | `DeliveryStatusChanged` | `new_status=delivered`일 때 해당 주문의 `ReviewEligible` 이벤트 발행 | `../07-delivery/05-events.md` |

## 5) 참고

- 이벤트 엔벨로프 공통 규격은 `../13-event/01-overview.md`에서 정의됨
- 위 페이로드는 엔벨로프의 `data` 필드에 포함되며, `event_type`·`event_id`·`timestamp` 등 공통 필드는 엔벨로프가 제공한다
