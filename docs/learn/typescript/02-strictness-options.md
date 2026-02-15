# 02. 엄격성(Strictness) 옵션

## 핵심 질문

> `strict: true` 하나면 충분한가? 추가 플래그 4개는 왜 필요한가?

## 한 줄 답

`strict`는 **타입 안전의 기본 세트**이고, 추가 4개는 `strict`에 포함되지 않는 **코드 품질 가드레일**이다.

---

## 현재 설정

```jsonc
{
  "compilerOptions": {
    "strict": true,                      // 타입 안전 기본 세트
    "noUnusedLocals": true,              // 미사용 변수 금지
    "noImplicitReturns": true,           // 모든 경로에 return 강제
    "noFallthroughCasesInSwitch": true,  // switch fallthrough 금지
    "noImplicitOverride": true           // override 키워드 강제
  }
}
```

---

## `strict: true` — 타입 안전의 기본 세트

`strict`는 단일 옵션이 아니라 **여러 개별 플래그의 번들**이다:

| 포함 플래그 | 효과 |
|------------|------|
| `strictNullChecks` | `null`/`undefined` 체크 강제 |
| `strictFunctionTypes` | 함수 파라미터 반변성(contravariance) 적용 |
| `strictBindCallApply` | `bind`/`call`/`apply` 타입 체크 |
| `strictPropertyInitialization` | 클래스 프로퍼티 초기화 강제 |
| `noImplicitAny` | 암묵적 `any` 금지 |
| `noImplicitThis` | 암묵적 `this` 금지 |
| `alwaysStrict` | 모든 파일에 `"use strict"` 적용 |
| `useUnknownInCatchVariables` | `catch(e)`에서 `e`가 `unknown` (TS 4.4+) |

### 왜 번들인가?

TypeScript 팀은 새로운 엄격 옵션을 추가할 때 `strict`에 포함시킨다.
`strict: true`로 두면 **TypeScript 업그레이드 시 자동으로 새 체크가 활성화**된다.

### 가장 중요한 개별 플래그

**`strictNullChecks`** — 이것 없으면 `strict`를 켠 의미가 반감된다:

```typescript
// strictNullChecks: false
function getUser(): User | null { return null; }
const user = getUser();
console.log(user.name); // ← 런타임 에러지만 컴파일 통과 ❌

// strictNullChecks: true
console.log(user.name); // ← 컴파일 에러 ✅
//          ~~~~ Object is possibly 'null'
```

**`useUnknownInCatchVariables`** — TS 4.4에서 추가된 비교적 새로운 플래그:

```typescript
// useUnknownInCatchVariables: false
try { ... } catch (e) {
  console.log(e.message); // e: any → 아무 프로퍼티나 접근 가능 (위험)
}

// useUnknownInCatchVariables: true
try { ... } catch (e) {
  console.log(e.message); // e: unknown → 타입 좁히기 필요 ✅
  //          ~~~~~~~ 'e' is of type 'unknown'
  if (e instanceof Error) {
    console.log(e.message); // ✅ OK
  }
}
```

### 2026.02 적절성

✅ **필수.** 이견 없음. 모든 새 프로젝트에서 켜야 한다.

---

## 추가 플래그 4개 — `strict`에 포함되지 않는 가드레일

### `"noUnusedLocals": true`

사용하지 않는 **지역 변수**에 에러를 발생시킨다.

```typescript
function processOrder(order: Order) {
  const tax = calculateTax(order);   // ❌ 'tax' is declared but its value is never read
  const total = order.subtotal;
  return total;
}
```

**왜 `strict`에 포함되지 않는가:**
- 타입 안전과 무관 (코드 품질 영역)
- 개발 중 임시 변수를 자주 만들므로 `strict`에 넣으면 DX 저하
- 일부 팀은 lint(oxlint/ESLint)에서만 잡기도 함

**이 프로젝트의 선택:**
TypeScript 레벨 + oxlint 양쪽에서 잡는 **벨트-앤-서스펜더** 방식.
코드가 에디터를 벗어나기 전에 잡힌다.

### 2026.02 적절성

✅ 권장. 단, `noUnusedParameters`는 빠져있다 — 콜백 시그니처에서 사용하지 않는 파라미터가 자주 발생하므로 의도적 누락일 수 있다. 필요하면 추가 가능.

---

### `"noImplicitReturns": true`

모든 코드 경로에서 **명시적 return**을 강제한다.

```typescript
// ❌ 에러: Not all code paths return a value
function getDiscount(tier: string): number {
  if (tier === "gold") return 0.2;
  if (tier === "silver") return 0.1;
  // "bronze"일 때 return이 없음 → undefined 반환
}

// ✅ 수정
function getDiscount(tier: string): number {
  if (tier === "gold") return 0.2;
  if (tier === "silver") return 0.1;
  return 0; // 기본값 명시
}
```

**왜 중요한가:**
- 빠뜨린 `return`은 `undefined`를 반환 → 타입 시스템이 `number`라고 보장했지만 실제로는 `undefined`
- 특히 조건 분기가 많은 비즈니스 로직에서 흔한 실수

### 2026.02 적절성

✅ 권장. 반환 타입이 있는 함수에서 경로 누락을 잡아준다.

---

### `"noFallthroughCasesInSwitch": true`

`switch`문에서 `break`/`return` 없이 다음 case로 떨어지는 것을 방지한다.

```typescript
// ❌ 에러: Fallthrough case in switch
function getStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "pending":
      logPending();     // break 없이 다음으로 떨어짐
    case "confirmed":
      return "접수됨";
    case "delivered":
      return "배송완료";
  }
}

// ✅ 수정
switch (status) {
  case "pending":
    logPending();
    return "대기중";    // 명시적 return
  case "confirmed":
    return "접수됨";
}
```

**의도적 fallthrough가 필요하면?**

```typescript
case "pending":
case "confirmed":  // pending과 confirmed을 같은 로직으로 처리 (빈 case는 허용)
  return "처리중";
```

### 2026.02 적절성

✅ 권장. 의도하지 않은 fallthrough는 잡기 어려운 버그의 흔한 원인.

---

### `"noImplicitOverride": true` (TS 4.3+)

부모 클래스 메서드를 오버라이드할 때 `override` 키워드를 **명시적으로 요구**한다.

```typescript
class BaseService {
  initialize() { /* ... */ }
  cleanup() { /* ... */ }
}

// ❌ 에러: This member must have an 'override' modifier
class OrderService extends BaseService {
  initialize() { /* 커스텀 초기화 */ }
}

// ✅ 수정
class OrderService extends BaseService {
  override initialize() { /* 커스텀 초기화 */ }
}
```

**왜 중요한가:**

리팩터링 안전망 역할을 한다:

```typescript
// 1) 부모 클래스에서 메서드 이름 변경
class BaseService {
  init() { /* initialize에서 이름 변경 */ }
}

// 2) override가 없으면: 자식이 조용히 새 메서드 정의 (부모 호출 안 됨)
class OrderService extends BaseService {
  initialize() { /* 부모의 init()과 무관한 새 메서드가 됨 😱 */ }
}

// 3) override가 있으면: 컴파일 에러로 즉시 감지 ✅
class OrderService extends BaseService {
  override initialize() { /* ❌ Base class doesn't have 'initialize' */ }
}
```

### 2026.02 적절성

✅ 권장. 특히 상속이 사용되는 코드베이스(Hono middleware 체인 등)에서 유용.

---

## 옵션 간 관계도

```
strict: true ──────────────────────────────────
│                                              │
│  strictNullChecks         noImplicitAny      │
│  strictFunctionTypes      noImplicitThis     │
│  strictBindCallApply      alwaysStrict       │
│  strictPropertyInit...    useUnknownInCatch  │
│                                              │
────────────────────────────────────────────────

↑ 타입 안전 (strict에 포함)
↓ 코드 품질 (strict에 미포함 — 별도 설정)

noUnusedLocals ·········· 미사용 변수 감지
noImplicitReturns ······· 반환 경로 누락 감지
noFallthroughCasesInSwitch  switch 버그 감지
noImplicitOverride ······ 상속 리팩터링 안전망
```

---

## 이 프로젝트에서의 적용

| 옵션 | 이 프로젝트의 맥락 |
|------|-------------------|
| `strict` | 전체 모노레포의 타입 안전 기준선 |
| `noUnusedLocals` | oxlint와 함께 이중 체크 (벨트-앤-서스펜더) |
| `noImplicitReturns` | 커머스 도메인의 복잡한 조건 분기에서 누락 방지 |
| `noFallthroughCasesInSwitch` | 주문 상태 머신 등 switch-heavy 코드 보호 |
| `noImplicitOverride` | Hono 미들웨어, 서비스 클래스 상속 시 안전망 |

---

## 다음 문서

[03. 모듈 시스템 옵션](./03-module-system.md) — `module`, `moduleResolution`, `verbatimModuleSyntax`의 관계
