# Inquiry Data

## CustomerInquiry 엔터티

- `id`: 문의 식별자
- `customer_id`: 문의 작성 고객 식별자
- `category`: 문의 카테고리(`order|payment|delivery|product|account|other`)
- `title`: 문의 제목
- `content`: 문의 본문
- `status`: 문의 상태(`open|in_progress|resolved|closed`)
- `created_at`: 문의 생성 시각
- `updated_at`: 문의 수정 시각
- `last_replied_at`: 최근 답변 시각 (운영자 답변이 등록될 때마다 갱신)

## InquiryReply 엔터티

- `id`: 답변 식별자
- `inquiry_id`: 대상 문의 식별자
- `author_role`: 답변 작성 권한(`operator|admin`)
- `author_id`: 답변 작성자 식별자
- `content`: 답변 본문
- `created_at`: 답변 생성 시각

## 본문 길이 제약

- `content` (문의 본문): 최대 **5,000자**
- `reply.content` (답변 본문): 최대 **10,000자**

## 상태 전이 규칙

- 기본 전이: `open -> in_progress -> resolved -> closed`
- 재오픈 전이: `resolved -> open` (고객 추가 질문 시)
- `closed`는 최종 상태이며, 재오픈 불가
- 답변/상태 변경 권한: `operator|admin`

## `last_replied_at` 갱신 규칙

- 운영자(`operator|admin`)가 `POST /inquiries/{id}/replies`로 답변을 등록할 때마다 현재 시각으로 갱신한다.
- 고객의 재오픈 추가 질문으로는 갱신되지 않는다.

## 접근 제약

- 고객은 자신의 문의만 조회 가능
