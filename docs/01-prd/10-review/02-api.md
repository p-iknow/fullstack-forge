# Review API Guide

## 1) 엔드포인트 목록

| 메서드   | 경로                           | 설명                       | 권한                        |
| -------- | ------------------------------ | -------------------------- | --------------------------- |
| `GET`    | `/products/:id/reviews`        | 상품별 리뷰 목록/요약 조회 | 공개                        |
| `GET`    | `/reviews/:id`                 | 리뷰 단건 조회             | 공개                        |
| `POST`   | `/reviews`                     | 리뷰 작성                  | 구매 확인된 고객            |
| `PATCH`  | `/reviews/:id`                 | 리뷰 수정 (본문·평점)      | 작성자 본인                 |
| `POST`   | `/reviews/:id/comments`        | 리뷰 댓글 작성             | `customer\|operator\|admin` |
| `POST`   | `/reviews/:id/images`          | 리뷰 이미지 업로드         | 작성자 본인                 |
| `DELETE` | `/reviews/:id/images/:imageId` | 리뷰 이미지 삭제           | 작성자 본인                 |

## 2) 고객 리뷰 작성/댓글 (PRD §2 원문)

### 고객 리뷰 작성/댓글

1. `GET /products/:id/reviews`에서 리뷰 목록/요약 조회
2. 배송 완료 주문의 구매자만 `POST /reviews` 작성 허용
3. 리뷰 작성자/운영자만 `POST /reviews/:id/comments` 허용
4. 부적절 콘텐츠는 운영자가 숨김 처리 후 사유 기록

## 3) 리뷰 이미지 업로드/삭제

### `POST /reviews/:id/images`

- `multipart/form-data`로 이미지 파일 전송
- 한 번의 요청으로 최대 **5장**까지 업로드 가능
- 기존 이미지와 합산하여 리뷰당 최대 5장 제한 초과 시 `review_image_limit_exceeded` 에러
- 서버에서 sharp 리사이즈(thumb 400×400, detail 1200×900) + WebP 변환 후 MinIO 저장
- 응답: 생성된 `ReviewImage` 목록 (id, thumb_url, detail_url, display_order)

### `DELETE /reviews/:id/images/:imageId`

- 작성자 본인만 삭제 가능
- MinIO 파일과 DB 레코드 동시 삭제 (hard delete)
- 삭제 후 남은 이미지의 `display_order` 재정렬

## 4) Rate Limit (PRD §5 원문)

- `POST /reviews`: 10 req / 15 min / user
- `POST /reviews/*/comments`: 20 req / 15 min / user
- `POST /reviews/*/images`: 10 req / 15 min / user

## 5) 에러 코드 (PRD §6 원문)

- `review_not_purchase_verified`
- `review_already_exists`
- `review_image_limit_exceeded` — 리뷰당 최대 이미지 수(5장) 초과
- `review_image_invalid_format` — 허용되지 않는 파일 포맷 (JPEG/PNG/WebP 외)
- `review_image_too_large` — 파일 크기 5 MB 초과
