---
title: 'Source Folder Structure'
description: 'TanStack Router 기반 서비스별 응집도 중심 폴더 구조 설계. Route → Screen 분리, 파일/폴더 결정 규칙, Store 앱 실제 예시를 포함합니다.'
type: guide
tags: [Architecture, React, TanStackRouter, BestPractice]
order: 2
---

# 소스 폴더 구조 — TanStack 기반 응집도 중심 설계

> **`pages/` 네이밍**: `pages/`는 TanStack 프레임워크 강제가 아닌 프로젝트 컨벤션입니다. TanStack Router는 `routes/`만 강제하며, 나머지 폴더명은 자유롭게 선택 가능합니다.

> **ADR (Architecture Decision Record)**: 이 문서의 설계 결정 과정과 기각된 대안들에 대한 상세한 기록은 [src-folder-structure.adr.md](./src-folder-structure.adr.md)를 참고하세요.

## Quick Reference

### Route → Page → @shared 레이어

| 레이어      | 위치                     | 역할                                  |
| ----------- | ------------------------ | ------------------------------------- |
| **Route**   | `src/routes/`            | URL ↔ 컴포넌트 매핑 (thin wrapper)    |
| **Page**    | `src/pages/`             | 실제 페이지 컴포넌트 (비즈니스 로직)  |
| **@shared** | `src/@shared/`           | 앱 인프라 (API client, query options) |
| **Layout**  | `src/routes/_layout.tsx` | Layout route는 routes에만 존재        |

### 분리 기준 (500줄)

| 상황                   | 구조                                           | 비고        |
| ---------------------- | ---------------------------------------------- | ----------- |
| 500줄 이하 단일 페이지 | `{context}-page.tsx`                           | 분리 불필요 |
| 500줄 초과             | `{context}-page.tsx` + `{context}-page.sub/`   | sub로 분리  |
| 탭/스텝 멀티뷰         | `{context}-page.tsx` + `{context}-page.views/` | 드문 케이스 |

### 파일 vs 폴더 결정 규칙

**모든 접미사(`.sub`, `.helper`, `.ui`)에 동일하게 적용되는 단일 규칙:**

| 추출할 항목 수 | 형태     | 예시                                                     |
| -------------- | -------- | -------------------------------------------------------- |
| **1개**        | **파일** | `cart-page.sub.tsx`, `header.helper.ts`, `header.ui.tsx` |
| **2개 이상**   | **폴더** | `cart-page.sub/`, `header.helper/`, `header.ui/`         |

```
결정 순서:
1. 500줄 이하? → 단일 파일 유지
2. 500줄 초과? → 분리 필요. 항목이 몇 개?
   → 1개면 파일 (*.sub.tsx, *.helper.ts, *.ui.tsx)
   → 2개 이상이면 폴더 (*.sub/, *.helper/, *.ui/)
3. 2곳 이상 사용? → @shared/로 즉시 이동
```

---

## 1. Route → Page Bridge

TanStack Router 환경에서는 `routes/`와 `pages/`를 분리합니다. Route 파일은 URL 매핑만 담당하는 thin wrapper이고, 실제 페이지 로직은 `pages/`에 위치합니다.

### Store 앱 실제 구조

```
apps/store/src/
├── routes/                              # TanStack Router (thin wrappers)
│   ├── __root.tsx                       # 루트 레이아웃
│   ├── _catalog.tsx                     # 카탈로그 레이아웃 (nav + footer)
│   ├── login.tsx                        # → pages/auth/login/login-page
│   ├── signup.tsx                       # → pages/auth/signup/signup-page
│   ├── password-update.tsx              # → pages/auth/password-update/...
│   └── _catalog/
│       ├── index.tsx                    # → pages/home/home-page
│       ├── cart.tsx                     # → pages/cart/cart-page
│       └── products.$productId.tsx      # → pages/catalog/product-detail-page
│
├── pages/                             # 실제 페이지 컴포넌트 (도메인별 구성)
│   ├── home/
│   │   ├── home-page.tsx                # 458줄 — 검색, 필터, 페이지네이션
│   │   └── home-page.test.tsx
│   ├── auth/
│   │   ├── login/
│   │   │   ├── login-page.tsx           # 154줄
│   │   │   └── login-page.test.tsx
│   │   ├── signup/
│   │   └── password-update/
│   ├── catalog/
│   │   ├── product-detail-page.tsx      # 239줄
│   │   ├── store-top-nav.tsx            # 레이아웃 공용 컴포넌트
│   │   └── product-detail-page.test.tsx
│   └── cart/
│       ├── cart-page.tsx                # 127줄 — ErrorBoundary + Suspense
│       ├── cart-item-row.tsx            # 170줄 — 수량 조절, 삭제
│       ├── cart-summary.tsx             # 44줄 — 합계, 주문 버튼
│       ├── empty-cart.tsx               # 16줄 — 빈 상태
│       └── *.test.tsx
│
└── @shared/                             # 앱 인프라 (cross-domain 공유)
    ├── api/                             # API client layer
    │   ├── core.ts                      # HTTP client, 에러 처리
    │   ├── generated-client.ts          # api-spec에서 자동 생성
    │   ├── auth.ts, catalog.ts, cart.ts # 도메인별 API 메서드
    │   └── index.ts                     # readApiError 등 공용 export
    ├── queries/                         # React Query options
    │   ├── auth.ts, catalog.ts, cart.ts # 도메인별 query/mutation options
    └── ui/                              # UI helpers
        └── cart-toast.tsx
```

### Route 파일 패턴

**Simple route (파라미터 없음):**

```tsx
// src/routes/login.tsx — thin wrapper
import { createFileRoute } from '@tanstack/react-router'
import { LoginPage } from '~/pages/auth/login/login-page'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})
```

**Layout route (하위 라우트 그룹):**

```tsx
// src/routes/_catalog.tsx — 레이아웃은 routes에만 존재
import { Outlet, createFileRoute } from '@tanstack/react-router'
import { StoreTopNav } from '~/pages/catalog/store-top-nav'

export const Route = createFileRoute('/_catalog')({
  component: CatalogLayout,
})

function CatalogLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <StoreTopNav />
      <Outlet />
      <footer>...</footer>
    </div>
  )
}
```

**Dynamic route (파라미터 있음):**

```tsx
// src/routes/_catalog/products.$productId.tsx
import { createFileRoute } from '@tanstack/react-router'
import { ProductDetailPage } from '~/pages/catalog/product-detail-page'

export const Route = createFileRoute('/_catalog/products/$productId')({
  component: ProductDetailRoute,
})

function ProductDetailRoute() {
  const { productId } = Route.useParams()
  return <ProductDetailPage productId={productId} />
}
```

> **핵심**: Route 파일은 `createFileRoute` + `component` 연결만 담당합니다. 비즈니스 로직, UI 컴포넌트, 상태 관리는 모두 `pages/`에 위치합니다. Layout route(`_catalog.tsx`)만 예외적으로 routes에 레이아웃 컴포넌트를 포함합니다.

---

## 2. `pages/` 폴더 구조

### 핵심 철학: 구조가 곧 정보

**폴더 구조 자체가 페이지의 비즈니스 로직과 컴포넌트 관계를 표현해야 합니다.**

### 도메인 기반 구성

`pages/`는 서비스 도메인별로 최상위 폴더를 구성합니다:

```
pages/
├── home/           # 홈/카탈로그 도메인
├── auth/           # 인증 도메인
│   ├── login/
│   ├── signup/
│   └── password-update/
├── catalog/        # 상품 상세 도메인
└── cart/           # 장바구니 도메인
```

각 페이지는 `{context}-page.tsx` 네이밍을 따릅니다:

```
auth/login/login-page.tsx           # ✅ 파일명에 맥락 포함
auth/signup/signup-page.tsx         # ✅ 검색, IDE 탭에서 즉시 식별
cart/cart-page.tsx                   # ✅

auth/login/page.tsx                 # ❌ 어떤 페이지인지 알 수 없음
```

---

## 3. 파일 분리 기준: 500줄

### LLM 토큰 관점의 파일 크기 가이드

| 코드 라인 수 | 대략적 토큰   | 판단                      |
| ------------ | ------------- | ------------------------- |
| **≤ 500줄**  | ~10K tokens   | **단일 파일 유지** (최적) |
| 500–700줄    | 10–14K tokens | 분리 고려                 |
| **700줄+**   | 14K+ tokens   | **분리 권장**             |

### Store 앱 현재 상태

| 파일                      | 줄 수    | 판단                           |
| ------------------------- | -------- | ------------------------------ |
| `login-page.tsx`          | 154줄    | ✅ 단일 파일 유지              |
| `product-detail-page.tsx` | 239줄    | ✅ 단일 파일 유지              |
| `home-page.tsx`           | 458줄    | ✅ 단일 파일 유지 (500줄 이하) |
| `cart-page.tsx` + sub 3개 | 총 357줄 | ✅ 이미 적절히 분리됨          |

### 파일 내부 배치 순서 (500줄 이하일 때)

```tsx
// product-detail-page.tsx — 239줄, 단일 파일에 모두 포함

// 1. 메인 컴포넌트 (상단)
export function ProductDetailPage({ productId }) { ... }

// 2. 서브 컴포넌트
function ProductDetailContent({ product, productId }) { ... }
function AddToCartControl({ productId }) { ... }

// 3. Skeleton/Fallback
function ProductDetailSkeleton() { ... }

// 4. Helper 함수 (최하단)
const formatPrice = (price: number) => `${new Intl.NumberFormat('ko-KR').format(price)}원`
```

---

## 4. 파일 vs 폴더 결정 규칙

> **이 섹션은 `.sub`, `.helper`, `.ui` 모든 접미사에 동일하게 적용되는 단일 규칙입니다.**

### 규칙: 항목 수로 결정

```
┌─────────────────────────────────────────────────────────┐
│  추출할 항목이 몇 개인가?                                │
│                                                         │
│  1개  → 파일  (*.sub.tsx, *.helper.ts, *.ui.tsx)         │
│  2개+ → 폴더  (*.sub/,    *.helper/,   *.ui/)           │
│                                                         │
│  ⚠️ 폴더 안에 파일 1개만 두지 않는다                      │
│  ⚠️ 파일이 2개로 늘어나면 즉시 폴더로 전환한다             │
└─────────────────────────────────────────────────────────┘
```

### 4.1 `.sub` 결정

**하위 컴포넌트를 몇 개 추출하는가?**

```
500줄 초과 페이지에서 하위 컴포넌트 분리 필요
│
├── 1개만 추출 → {context}-page.sub.tsx (파일)
│
└── 2개 이상 추출 → {context}-page.sub/ (폴더)
    ├── header/
    │   └── header.tsx
    ├── content/
    │   └── content.tsx
    └── footer/
        └── footer.tsx
```

**1개 추출 예시 — `cart-page.sub.tsx`:**

```tsx
// cart-page.sub.tsx — 복잡한 CartContentSection 하나만 추출
export function CartContentSection({ cart }: Readonly<{ cart: CartResponse }>) {
  const queryClient = useQueryClient()
  const clearMutation = useMutation({ ... })
  // ... 복잡한 렌더링 로직
}
```

**2개 이상 추출 예시 — `cart-page.sub/`:**

```
cart/
├── cart-page.tsx                # 메인 — sub들을 조합
└── cart-page.sub/
    ├── cart-item-row/
    │   ├── cart-item-row.tsx     # 수량 조절, optimistic update
    │   └── cart-item-row.test.tsx
    ├── cart-summary/
    │   └── cart-summary.tsx      # 합계, 주문 버튼
    └── empty-cart/
        └── empty-cart.tsx        # 빈 장바구니 상태
```

### 4.2 `.helper` 결정

**추출할 로직 파일이 몇 개인가?**

```
Sub 컴포넌트 내부가 복잡해서 로직 분리 필요
│
├── 1개 파일로 충분 → header.helper.ts (파일)
│   (hooks, 상수, 계산 함수 모두 포함)
│
└── 2개 이상 필요 → header.helper/ (폴더)
    ├── calculate-progress.ts
    ├── calculate-progress.test.ts
    └── format-data.ts
```

**1개 파일 예시 — `header.helper.ts`:**

```tsx
// header.helper.ts — hooks, 상수, 유틸 모두 하나에
export const MAX_TITLE_LENGTH = 50
export const PROGRESS_ANIMATION_MS = 300

export const useHeaderData = (userId: string) => { ... }
export const calculateProgress = (data: StepData) => { ... }
```

**2개 파일 예시 — `header.helper/`:**

```
header/
├── header.tsx
└── header.helper/
    ├── calculate-progress.ts       # 진행률 계산 로직
    ├── calculate-progress.test.ts  # 테스트
    └── format-data.ts              # 데이터 포맷 로직
```

### 4.3 `.ui` 결정

**추출할 Presentational 컴포넌트가 몇 개인가?**

```
Sub 컴포넌트에서 순수 렌더링 컴포넌트 분리 필요
│
├── 1개 컴포넌트 → header.ui.tsx (파일)
│
└── 2개 이상 → header.ui/ (폴더)
    ├── title.tsx
    └── progress-bar.tsx
```

**1개 컴포넌트 예시 — `header.ui.tsx`:**

```tsx
// header.ui.tsx — Presentational 컴포넌트 1개
export function HeaderTitle({
  title,
  subtitle,
}: Readonly<{
  title: string
  subtitle: string
}>) {
  return (
    <div>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  )
}
```

**2개 컴포넌트 예시 — `header.ui/`:**

```
header/
├── header.tsx
└── header.ui/
    ├── title.tsx          # HeaderTitle 컴포넌트
    └── progress-bar.tsx   # ProgressBar 컴포넌트
```

### 4.4 전환 시나리오: 파일 → 폴더

항목이 1개에서 2개로 늘어나면 **즉시 폴더로 전환**합니다:

```
# Before: 파일 1개
header/
├── header.tsx
└── header.helper.ts          # helper 1개 → 파일

# After: 새로운 helper 추가 시 → 폴더로 전환
header/
├── header.tsx
└── header.helper/             # helper 2개 → 폴더
    ├── calculate-progress.ts  # 기존 내용 이동
    └── format-data.ts         # 새로 추가
```

> **⚠️ 절대 금지**: 폴더 안에 파일 1개만 두기
>
> ```
> # ❌ 폴더인데 파일이 1개뿐
> header.helper/
> └── calculate-progress.ts    # 이러면 header.helper.ts로 충분
>
> # ✅ 1개면 파일
> header.helper.ts
> ```

### 4.5 한눈에 보는 전체 결정 테이블

| 접미사    | 1개일 때       | 2개 이상일 때 | 포함하는 것                               |
| --------- | -------------- | ------------- | ----------------------------------------- |
| `.sub`    | `*.sub.tsx`    | `*.sub/`      | 하위 컴포넌트                             |
| `.helper` | `*.helper.ts`  | `*.helper/`   | hooks, 상수, 계산 함수, 유효성 검사       |
| `.ui`     | `*.ui.tsx`     | `*.ui/`       | Presentational(Dumb) 컴포넌트             |
| `.views`  | —              | `*.views/`    | 완전히 다른 화면 (항상 폴더, 드문 케이스) |
| `.event`  | `*.event.ts`   | —             | 이벤트 명세 (항상 파일)                   |
| `.types`  | `*.types.ts`   | —             | 공유 타입 (선택, 항상 파일)               |
| `.test`   | `*.test.ts(x)` | —             | 테스트 (항상 파일, co-located)            |

---

## 5. 폴더 유형 설명

### 계층 구조

```
page-level
├── {context}-page.tsx          # 메인 페이지 컴포넌트
├── {context}-page.event.ts     # 이벤트 명세
├── {context}-page.sub/         # 하위 컴포넌트들
│   └── header/
│       ├── header.tsx           # 메인 (Smart Component)
│       ├── header.helper.ts     # 로직 (hooks, 상수, 유틸)
│       └── header.ui.tsx        # Presentational (Dumb Component)
└── {context}-page.views/       # 멀티뷰 (드문 케이스)
```

| 폴더        | 의미                    | 사용 시점                           |
| ----------- | ----------------------- | ----------------------------------- |
| `*.sub/`    | 모든 하위 컴포넌트      | 페이지 > 500줄, 기본 분리 방식      |
| `*.views/`  | 완전히 다른 화면        | 탭/스텝/조건부 렌더링 (드문 케이스) |
| `*.helper/` | 비즈니스 로직           | sub 내부가 복잡할 때                |
| `*.ui/`     | Presentational 컴포넌트 | sub 내부에서 순수 UI 분리할 때      |

### View vs Sub 선택 기준

| 구분     | `*.sub/` (기본)              | `*.views/` (드문 케이스)    |
| -------- | ---------------------------- | --------------------------- |
| **용도** | 모든 하위 컴포넌트           | 완전히 다른 화면/UI         |
| **표시** | 동시에 화면에 표시될 수 있음 | 조건에 따라 하나만 표시됨   |
| **예시** | 헤더, 콘텐츠, 버튼, 모달     | 탭1 화면, 탭2 화면          |
| **빈도** | 대부분의 페이지              | 복잡한 멀티스텝/탭 페이지만 |

---

## 6. 실제 구조 예시 (Store 앱 기준)

### Case 1: 500줄 이하 — 단일 파일 유지

Store의 `login-page.tsx` (154줄) — 분리 불필요:

```
pages/auth/login/
├── login-page.tsx              # 154줄 — 폼, 유효성 검사, OAuth 모두 포함
└── login-page.test.tsx         # co-located 테스트
```

```tsx
// login-page.tsx — 모든 것이 한 파일에
export function LoginPage() {
  const navigate = useNavigate()
  const form = useForm<LoginFormValues>({ ... })
  const loginMutation = useMutation({ ...loginMutationOptions() })

  return (
    <main className="flex min-h-screen items-center justify-center">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* 폼 필드, 에러 표시, OAuth 버튼 */}
      </form>
    </main>
  )
}

// Zod 스키마도 같은 파일 상단에
const loginSchema = z.object({
  email: z.string().email('유효하지 않은 이메일 주소입니다.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
})
```

### Case 2: 500줄 이하이지만 sub 컴포넌트가 별도 파일 — 도메인 응집

Store의 `cart/` (총 357줄, 4개 파일) — 각 sub가 독립적 비즈니스 로직 보유:

```
pages/cart/
├── cart-page.tsx             # 127줄 — ErrorBoundary + Suspense 조합
├── cart-item-row.tsx         # 170줄 — optimistic update, 수량 변경
├── cart-summary.tsx          # 44줄 — 합계, 주문 버튼
├── empty-cart.tsx            # 16줄 — 빈 상태 fallback
└── *.test.tsx                # 각 컴포넌트별 테스트
```

> **참고**: 현재 Store 앱의 cart 폴더는 `.sub/` 컨벤션 적용 전에 만들어진 구조입니다.
> 컨벤션 적용 시 아래와 같이 구성합니다:

```
pages/cart/
├── cart-page.tsx              # 메인 — sub들을 조합
├── cart-page.event.ts         # 이벤트 명세 (선택)
└── cart-page.sub/             # 하위 컴포넌트 3개 → 폴더
    ├── cart-item-row/
    │   ├── cart-item-row.tsx
    │   └── cart-item-row.test.tsx
    ├── cart-summary/
    │   ├── cart-summary.tsx
    │   └── cart-summary.test.tsx
    └── empty-cart/
        ├── empty-cart.tsx
        └── empty-cart.test.tsx
```

### Case 3: 500줄 초과 — sub 분리 필요 (향후 예시)

Store의 `home-page.tsx` (458줄)가 500줄을 초과할 경우:

```
pages/home/
├── home-page.tsx               # 메인 — sub들을 조합 (축소됨)
├── home-page.event.ts          # 이벤트 명세
└── home-page.sub/
    ├── search-section/
    │   └── search-section.tsx   # 검색 폼, 필터
    ├── product-grid/
    │   ├── product-grid.tsx     # 상품 그리드 렌더링
    │   └── product-grid.ui.tsx  # StockBadge 등 순수 UI (1개 → 파일)
    └── pagination/
        └── pagination.tsx       # 페이지네이션 컨트롤
```

### Case 4: 멀티뷰 페이지 (views)

탭/스텝 기반 페이지처럼 조건에 따라 완전히 다른 화면을 보여주는 경우:

```
pages/orders/checkout/
├── checkout-page.tsx            # 뷰 전환 로직 (currentStep 관리)
├── checkout-page.event.ts
└── checkout-page.views/         # 완전히 다른 화면들
    ├── intro-view/
    │   ├── intro-view.tsx
    │   └── intro-view.sub/
    │       └── form-section/
    │           └── form-section.tsx
    └── result-view/
        ├── result-view.tsx
        └── result-view.sub/
            └── summary/
                ├── summary.tsx
                └── summary.helper.ts   # helper 1개 → 파일
```

### Case 5: Sub 내부가 복잡 — helper/ui 분리

```
pages/orders/checkout/
├── checkout-page.tsx
└── checkout-page.sub/
    └── payment-form/
        ├── payment-form.tsx           # 메인 (Smart Component)
        ├── payment-form.helper/       # helper 2개+ → 폴더
        │   ├── validate.ts
        │   ├── validate.test.ts
        │   └── calculate.ts
        └── payment-form.ui/           # ui 2개+ → 폴더
            ├── card-input.tsx
            └── amount-display.tsx
```

---

## 7. 파일 유형별 위치 가이드

```
header/
├── header.tsx              # 메인 컴포넌트 (Smart)
├── header.helper.ts        # 로직, hooks, 상수 포함
├── header.ui.tsx           # Presentational 컴포넌트
├── header.types.ts         # 타입 정의 (선택)
└── header.test.ts          # 테스트 (co-located)
```

| 파일 유형         | 위치           | 포함 내용                                     |
| ----------------- | -------------- | --------------------------------------------- |
| **메인 컴포넌트** | `*.tsx`        | 상태 관리, 이벤트 핸들링, 렌더링 로직         |
| **Helper**        | `*.helper.ts`  | 비즈니스 로직, hooks(useXxx), 상수, 계산 함수 |
| **UI**            | `*.ui.tsx`     | Presentational 컴포넌트, 스타일 컴포넌트      |
| **Types**         | `*.types.ts`   | 페이지/뷰 내 공유 타입 (선택사항)             |
| **Test**          | `*.test.ts(x)` | 단위 테스트 (co-located)                      |
| **Event**         | `*.event.ts`   | 이벤트 명세                                   |

> **Helper에 포함되는 것들:**
>
> - 커스텀 hooks (`useHeaderData`, `useFormValidation`)
> - 비즈니스 로직 함수 (`calculateProgress`, `formatProductData`)
> - 상수 값 (`MAX_RETRY_COUNT`, `ANIMATION_DURATION_MS`)
> - 유효성 검사 (`validateInput`, `isValidAmount`)
>
> **API 레이어는 `@shared/`에 중앙 관리:**
>
> - `@shared/queries/` — React Query options (`catalogListQueryOptions`, `cartQueryOptions`)
> - `@shared/api/` — API client (`catalogApi.list()`, `authApi.login()`)
> - 페이지 전용 가공 로직만 `*.helper.ts`에 포함

---

## 8. @shared 모델 — Scope Localization

### 핵심 원칙: 가장 좁은 범위에서 공유

**공유 자원은 사용하는 범위에 가장 가까운 `@shared/`에 위치한다. 범위를 넘어서 사용될 때만 상위로 승격한다.**

### 4-tier 공유 계층

```
src/
├── @shared/                         # L1: 앱 인프라 (cross-domain)
│   ├── api/                         #     API client, 에러 처리
│   │   ├── core.ts                  #     HTTP client 기반
│   │   ├── generated-client.ts      #     api-spec 자동 생성
│   │   ├── auth.ts                  #     Auth API (2+ 도메인 사용)
│   │   ├── catalog.ts               #     Catalog API (2+ 도메인 사용)
│   │   └── cart.ts                  #     Cart API (2+ 도메인 사용)
│   ├── queries/                     #     React Query options
│   │   ├── auth.ts                  #     Auth queries (2+ 도메인 사용)
│   │   ├── catalog.ts               #     Catalog queries (2+ 도메인 사용)
│   │   └── cart.ts                  #     Cart queries (2+ 도메인 사용)
│   └── ui/                          #     공용 UI helpers
│
├── pages/
│   ├── @shared/                     # L2: 페이지 cross-domain 공용
│   │   └── ui/                      #     (2+ 도메인 페이지에서 사용하는 컴포넌트)
│   │
│   ├── auth/
│   │   ├── @shared/                 # L3: auth 도메인 공용
│   │   │   ├── ui/                  #     auth 페이지들에서만 사용하는 UI
│   │   │   └── helper/              #     auth 페이지들에서만 사용하는 로직
│   │   ├── login/
│   │   ├── signup/
│   │   └── password-update/
│   │
│   ├── catalog/
│   │   ├── @shared/                 # L3: catalog 도메인 공용
│   │   └── ...
│   │
│   └── cart/
│       ├── @shared/                 # L3: cart 도메인 공용
│       │   └── ui/                  #     cart 페이지들에서만 사용하는 UI
│       ├── cart-page.tsx
│       └── cart-page.sub/
│
└── routes/
```

### Scope 결정 플로우

```
새로운 공유 자원 생성 시:

1. 한 페이지 내에서만 사용?
   → 페이지 내부에 co-locate (*.helper.ts, *.ui.tsx)

2. 같은 도메인 내 2+ 페이지에서 사용?
   → pages/{domain}/@shared/ (L3)
   예: auth의 login + signup에서 사용하는 AuthFormLayout
       → pages/auth/@shared/ui/auth-form-layout.tsx

3. 2+ 도메인에서 사용?
   → src/@shared/ (L1)
   예: cartQueryOptions가 cart + catalog에서 사용
       → src/@shared/queries/cart.ts

4. 2+ 앱에서 사용? (store + admin)
   → packages/design-system 또는 packages/shared (L0)
```

### 승격/강등 규칙

| 상황                               | 액션                                  |
| ---------------------------------- | ------------------------------------- |
| 1곳에서만 사용                     | 해당 페이지/컴포넌트 내부에 co-locate |
| **같은 도메인 2+ 페이지에서 사용** | **`pages/{domain}/@shared/`로 승격**  |
| **2+ 도메인에서 사용**             | **`src/@shared/`로 승격**             |
| **2+ 앱에서 사용**                 | **`packages/`로 승격**                |
| 사용처가 줄어 1곳만 남음           | **즉시 해당 위치로 강등 (co-locate)** |

> **⚠️ 무조건 가장 좁은 scope에서 시작.** 필요할 때만 승격. 필요 없어지면 강등.

### Store 앱 현재 상태

현재 Store 앱에서 auth/catalog/cart queries는 모두 cross-domain으로 사용 중이므로 `src/@shared/`에 위치합니다:

| 리소스               | 사용 도메인    | 위치           | 이유                                    |
| -------------------- | -------------- | -------------- | --------------------------------------- |
| `queries/auth.ts`    | auth + catalog | `src/@shared/` | store-top-nav(catalog)에서 meQuery 사용 |
| `queries/catalog.ts` | home + catalog | `src/@shared/` | home-page + product-detail에서 사용     |
| `queries/cart.ts`    | cart + catalog | `src/@shared/` | store-top-nav + product-detail에서 사용 |
| `api/core.ts`        | 전체           | `src/@shared/` | 앱 인프라                               |

향후 도메인-only 리소스가 생기면 해당 도메인 `@shared/`에 배치합니다:

```tsx
// 예: 주문 도메인이 추가되고, 주문 전용 유효성 검사 로직이 생긴 경우
// intro-page와 payment-page에서만 사용 → orders 도메인 @shared

pages/orders/
├── @shared/
│   └── helper/
│       └── validate-order.ts    # 주문 도메인 내에서만 사용
├── intro/
│   └── intro-page.tsx           # validate-order 사용
└── payment/
    └── payment-page.tsx         # validate-order 사용
```

### @shared 내부 구성

| 폴더       | 포함 내용                | 예시                                          |
| ---------- | ------------------------ | --------------------------------------------- |
| `api/`     | API client 함수          | `catalogApi.list()`, `authApi.login()`        |
| `queries/` | React Query options      | `catalogListQueryOptions`, `cartQueryOptions` |
| `ui/`      | 공유 UI 컴포넌트/helpers | `AuthFormLayout`, `cartToast`                 |
| `helper/`  | 공유 비즈니스 로직       | `validateOrder`, `formatPrice`                |

> Cross-app 공유 (store + admin) → `packages/design-system` 또는 `packages/shared`

---

## 9. 네이밍 규칙

### 페이지 파일: `{context}-page.tsx`

```
# ✅ 파일명에 맥락 포함
auth/login/login-page.tsx
cart/cart-page.tsx
catalog/product-detail-page.tsx

# ❌ 맥락 없음 — IDE 탭, 검색, 에러 스택에서 구분 불가
auth/login/page.tsx
cart/page.tsx
```

| 상황          | `page.tsx`                         | `login-page.tsx`              |
| ------------- | ---------------------------------- | ----------------------------- |
| **파일 검색** | `page.tsx` 결과 수십 개            | `login-page` 검색 → 즉시 특정 |
| **IDE 탭**    | 탭 5개 모두 `page.tsx` → 구분 불가 | 각 페이지명으로 구분          |
| **에러 스택** | `at page.tsx:42` → 어느 페이지?    | `at login-page.tsx:42` → 명확 |

### Sub 컴포넌트 네이밍

**파일명은 간소하게, 컴포넌트명에는 맥락 포함:**

```tsx
// 파일: cart-page.sub/cart-item-row/cart-item-row.tsx
export function CartItemRow({ item }: Readonly<{ item: CartItem }>) { ... }

// 파일: cart-page.sub/cart-summary/cart-summary.tsx
export function CartSummary({ cart }: Readonly<{ cart: CartResponse }>) { ... }
```

### 컨벤션 요약

| 규칙                        | 내용                                                          |
| --------------------------- | ------------------------------------------------------------- |
| **Kebab-case**              | 모든 파일/폴더명 (`cart-item-row.tsx`, 한글·camelCase 금지)   |
| **No barrel exports**       | `index.ts` 재export 금지 (tree-shaking, 순환 참조 방지)       |
| **직접 import**             | `from './header.helper/calculateProgress'`                    |
| **Declaration-time export** | `export function`, `export const` (trailing export 블록 금지) |

---

## 10. 주의사항 (Anti-patterns)

### ❌ 500줄 미만인데 불필요하게 분리

```
# ❌ 154줄인데 sub 폴더 생성
login/
├── login-page.tsx
└── login-page.sub/
    └── form/
        └── form.tsx          # 깊이만 깊어지고 응집도 저하

# ✅ 500줄 이하면 단일 파일
login/
└── login-page.tsx             # 모든 것 포함
```

### ❌ 폴더 안에 파일 1개만 두기

```
# ❌ 폴더인데 내용물 1개뿐
header.helper/
└── calculate-progress.ts      # 폴더 불필요, 파일로 충분

# ✅ 1개면 파일
header.helper.ts               # calculate-progress 내용 포함
```

### ❌ @shared의 무분별한 사용

```
# ❌ 한 곳에서만 사용하는데 @shared에 위치
catalog/
├── @shared/
│   └── ui/
│       └── stock-badge.tsx     # home-page에서만 사용

# ✅ 사용처에 co-locate
catalog/
└── home-page.tsx               # StockBadge를 inline으로 포함 (500줄 이하)
```

### ❌ 과도한 폴더 중첩

```
# ❌ 실용적 최대 깊이 초과
page → sub → component → sub → component → ui → ...

# ✅ 최대 실용 깊이: page → sub → helper/ui
home-page.sub/
└── product-grid/
    ├── product-grid.tsx
    ├── product-grid.helper.ts   # 여기까지
    └── product-grid.ui.tsx      # 더 이상 깊어지지 않음
```

---

## 11. 관련 문서

- [Page Component Structure](./page-component-structure.md): 페이지 컴포넌트 내부 구조 설계
- [ADR: Source Folder Structure](./src-folder-structure.adr.md): 설계 결정 과정과 기각된 대안
- [Design Requirements](./src-folder-structure.requirement.md): 학술적/논리적 근거
- [Frontend Architecture](../01-frontend.md): 프론트엔드 스택 개요
- [API Patterns](../02-api-patterns.md): 데이터 페칭과 상태 관리 패턴
