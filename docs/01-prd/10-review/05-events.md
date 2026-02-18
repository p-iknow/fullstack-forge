# Review Events

## 1) 도메인 이벤트 최소 범위 (PRD §1 원문)

- 리뷰/댓글: `ReviewCreated`, `ReviewCommentCreated`, `ReviewHiddenByOperator`

## 2) 이벤트 목록 및 페이로드

### `ReviewCreated`

리뷰가 최초 생성되었을 때 발행한다.

| 필드         | 타입       | 설명           |
| ------------ | ---------- | -------------- |
| `review_id`  | `string`   | 생성된 리뷰 ID |
| `product_id` | `string`   | 대상 상품 ID   |
| `user_id`    | `string`   | 작성자 ID      |
| `rating`     | `integer`  | 평점 (`1..5`)  |
| `created_at` | `datetime` | 생성 시각      |

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

## 3) 참고

- 이벤트 엔벨로프 공통 규격은 `../13-event/01-overview.md`에서 정의됨
- 위 페이로드는 엔벨로프의 `data` 필드에 포함되며, `event_type`·`event_id`·`timestamp` 등 공통 필드는 엔벨로프가 제공한다
