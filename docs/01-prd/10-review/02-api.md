# Review API Guide

## 1) 엔드포인트 목록

| 메서드  | 경로                    | 설명                       | 권한                        |
| ------- | ----------------------- | -------------------------- | --------------------------- |
| `GET`   | `/products/:id/reviews` | 상품별 리뷰 목록/요약 조회 | 공개                        |
| `GET`   | `/reviews/:id`          | 리뷰 단건 조회             | 공개                        |
| `POST`  | `/reviews`              | 리뷰 작성                  | 구매 확인된 고객            |
| `PATCH` | `/reviews/:id`          | 리뷰 수정 (본문·평점)      | 작성자 본인                 |
| `POST`  | `/reviews/:id/comments` | 리뷰 댓글 작성             | `customer\|operator\|admin` |

## 2) 고객 리뷰 작성/댓글 (PRD §2 원문)

### 고객 리뷰 작성/댓글

1. `GET /products/:id/reviews`에서 리뷰 목록/요약 조회
2. 배송 완료 주문의 구매자만 `POST /reviews` 작성 허용
3. 리뷰 작성자/운영자만 `POST /reviews/:id/comments` 허용
4. 부적절 콘텐츠는 운영자가 숨김 처리 후 사유 기록

## 3) Rate Limit (PRD §5 원문)

- `POST /reviews`: 10 req / 15 min / user
- `POST /reviews/*/comments`: 20 req / 15 min / user

## 4) 에러 코드 (PRD §6 원문)

- `review_not_purchase_verified`
- `review_already_exists`
