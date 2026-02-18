# Review Data Model

## 1) 목적

- review 도메인의 핵심 엔터티와 관계를 정의한다.
- 이 문서는 엔터티 책임과 도메인 규칙을 다루며 컬럼 타입/인덱스 정의는 포함하지 않는다.

## 2) 핵심 엔터티 (PRD §1 원문)

- `Review`
- `ReviewComment`

## 3) Review 엔터티 필드

| 필드            | 설명                | 제약                        |
| --------------- | ------------------- | --------------------------- |
| `id`            | 리뷰 고유 식별자    | PK                          |
| `product_id`    | 리뷰 대상 상품      | FK                          |
| `user_id`       | 작성자              | FK                          |
| `order_item_id` | 구매 증빙 주문 항목 | FK, unique per user×product |
| `title`         | 리뷰 제목           | 최대 100자                  |
| `body`          | 리뷰 본문           | 최대 2,000자                |
| `rating`        | 평점                | `1..5` 정수                 |
| `status`        | 리뷰 상태           | `visible\|hidden\|flagged`  |
| `created_at`    | 생성 시각           | 서버 기준 UTC               |
| `updated_at`    | 최종 수정 시각      | 서버 기준 UTC               |

## 4) Review 엔터티 반영 정책 (PRD §10 원문)

- 리뷰 작성 가능 조건:
  - 주문 상태 `delivered`
  - 리뷰 대상 SKU를 실제 구매한 사용자
- 사용자당 `order_item` 기준 리뷰 1개(수정은 허용, 중복 생성 금지)
- 평점 범위: `1..5`
- 리뷰 상태: `visible|hidden|flagged`

## 5) ReviewComment 엔터티 필드

| 필드         | 설명             | 제약          |
| ------------ | ---------------- | ------------- |
| `id`         | 댓글 고유 식별자 | PK            |
| `review_id`  | 대상 리뷰        | FK            |
| `user_id`    | 작성자           | FK            |
| `body`       | 댓글 본문        | 최대 500자    |
| `deleted_at` | soft delete 시각 | nullable      |
| `created_at` | 생성 시각        | 서버 기준 UTC |

## 6) ReviewComment 엔터티 반영 정책 (PRD §10 원문)

- 댓글 작성 권한: `customer|operator|admin`
- 숨김/삭제 권한: `operator|admin`
- 댓글 삭제는 soft delete를 기본으로 하고 감사 로그를 남김
