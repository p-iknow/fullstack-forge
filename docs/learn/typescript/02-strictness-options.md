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
    "strict": true,
    "noUnusedLocals": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
  },
}
```

---

## `"strict": true` — 타입 안전 기본 세트

**Problem** — 개별 플래그를 하나씩 켜면, TS 업그레이드 시 새 체크를 놓친다. `strictNullChecks` 하나만 꺼져도 `null` 참조가 프로덕션까지 간다:

```typescript
// strictNullChecks: false
function getUser(): User | null {
  return null
}
const user = getUser()
console.log(user.name) // 컴파일 통과, 런타임 폭발
```

**Action** — `strict: true`는 8개 플래그 번들(`strictNullChecks`, `noImplicitAny`, `useUnknownInCatchVariables` 등). 하나로 켜면 TS 업그레이드 시 새 체크도 자동 활성화:

```typescript
// strict: true
const user = getUser();
console.log(user.name);
//          ~~~~ Object is possibly 'null'

try { ... } catch (e) {
  // e: unknown → 타입 좁히기 필요
  if (e instanceof Error) console.log(e.message);
}
```

**Result** — 모든 새 프로젝트의 사실상 필수. ✅ 이견 없음.

> **Caveat**: TS 업그레이드 시 `strict` 번들에 새 플래그가 추가되면 기존 코드에서 에러가 발생할 수 있다. 이는 의도된 동작이며 릴리즈 노트 확인 권장.

---

## `"noUnusedLocals": true` — 미사용 변수 금지

**Problem** — 사용하지 않는 변수가 남아있으면 죽은 코드가 누적되고, "지워도 되나?" 혼란이 생긴다:

```typescript
function processOrder(order: Order) {
  const tax = calculateTax(order) // 쓰지 않는 변수
  return order.subtotal
}
```

**Action** — 미사용 지역 변수에 에러를 발생시킨다. 이 프로젝트는 TypeScript + oxlint 이중 체크:

```typescript
const tax = calculateTax(order)
//    ~~~ 'tax' is declared but its value is never read
```

**Result** — 코드가 에디터를 벗어나기 전에 죽은 코드를 잡는다. ✅ 권장.

> **Caveat**: 개발 중 임시 변수에 번거로울 수 있다. `strict`에 포함되지 않는 이유. 일부 팀은 lint에서만 잡고 tsconfig에서는 끈다. `noUnusedParameters`는 현재 빠져있음 — 콜백 시그니처에서 사용하지 않는 파라미터가 자주 발생하므로 의도적 누락.

---

## `"noImplicitReturns": true` — 반환 경로 누락 방지

**Problem** — 조건 분기가 많은 함수에서 `return`을 빠뜨리면 `undefined`가 반환되지만, 타입 시스템은 반환 타입을 보장한다고 믿고 있다:

```typescript
function getDiscount(tier: string): number {
  if (tier === 'gold') return 0.2
  if (tier === 'silver') return 0.1
  // "bronze"일 때 return 없음 → undefined 반환
}
```

**Action** — 모든 코드 경로에서 명시적 `return`을 강제한다:

```typescript
function getDiscount(tier: string): number {
  if (tier === 'gold') return 0.2
  if (tier === 'silver') return 0.1
  return 0 // 기본값 명시
}
```

**Result** — 커머스 도메인의 복잡한 조건 분기(주문 상태, 할인 계산 등)에서 누락 방지. ✅ 권장.

---

## `"noFallthroughCasesInSwitch": true` — switch fallthrough 금지

**Problem** — `break` 없이 다음 case로 떨어지는 fallthrough는 잡기 어려운 버그의 흔한 원인:

```typescript
switch (status) {
  case 'pending':
    logPending() // break 없이 다음으로 떨어짐
  case 'confirmed':
    return '접수됨' // pending일 때도 "접수됨" 반환
}
```

**Action** — 비어있지 않은 case에서 `break`/`return` 없이 떨어지면 에러. 의도적 공유는 빈 case로:

```typescript
case "pending":
case "confirmed":  // 빈 case → fallthrough 허용
  return "처리중";
```

**Result** — 주문 상태 머신 등 switch-heavy 코드에서 의도하지 않은 fallthrough 방지. ✅ 권장.

---

## `"noImplicitOverride": true` — 상속 리팩터링 안전망

**Problem** — 부모 클래스에서 메서드 이름을 바꾸면, `override` 없는 자식이 조용히 새 메서드를 정의해 부모 호출이 끊어진다:

```typescript
class BaseService {
  init() {
    /* initialize에서 이름 변경됨 */
  }
}
class OrderService extends BaseService {
  initialize() {
    /* 부모의 init()과 무관한 새 메서드 */
  }
}
```

**Action** — `override` 키워드를 강제하여, 부모에 해당 메서드가 없으면 컴파일 에러:

```typescript
class OrderService extends BaseService {
  override initialize() {
    /* Base class doesn't have 'initialize' ❌ */
  }
  override init() {
    /* 정확한 오버라이드 ✅ */
  }
}
```

**Result** — Hono 미들웨어, 서비스 클래스 상속 시 리팩터링 안전망. ✅ 권장.

---

## 이 프로젝트에서의 적용

| 옵션                         | 해결하는 문제                                               |
| ---------------------------- | ----------------------------------------------------------- |
| `strict`                     | `null` 참조, 암묵적 `any`, `catch` 변수 등 타입 안전 기본선 |
| `noUnusedLocals`             | 죽은 코드 누적 방지 (oxlint와 이중 체크)                    |
| `noImplicitReturns`          | 복잡한 조건 분기에서 `return` 누락 방지                     |
| `noFallthroughCasesInSwitch` | switch 상태 머신의 의도치 않은 fallthrough 방지             |
| `noImplicitOverride`         | 부모 클래스 리팩터링 시 자식 클래스 동기화 보장             |

---

## 다음 문서

[03. 모듈 시스템 옵션](./03-module-system.md) — `module`, `moduleResolution`, `verbatimModuleSyntax`의 관계
