# 04. sideEffects와 CSS tree-shaking

## 핵심 질문

> `sideEffects` 필드는 무엇이고, 왜 CSS 파일에 반드시 설정해야 하는가?

## 한 줄 답

`sideEffects` 필드는 번들러에게 "이 패키지의 어떤 모듈이 import만으로 부수 효과를 일으키는지" 알려준다. CSS 파일처럼 바인딩 없이 import하는 모듈은 반드시 `sideEffects`에 명시해야 tree-shaking으로 삭제되지 않는다.

---

## 현재 설정

```jsonc
// packages/design-system/package.json
{
  "sideEffects": ["./src/styles/**/*.css"],
}
```

---

## `sideEffects: false` — tree-shaking 최적화의 원리

**Problem** — 모던 번들러(Vite, webpack, Rolldown)는 tree-shaking으로 사용하지 않는 코드를 제거한다. `package.json`에 `sideEffects: false`가 선언되면, 번들러는 "이 패키지의 모든 모듈은 부수 효과가 없다"고 판단한다. export 바인딩이 없는 import은 "unused"로 분류되어 번들에서 제거된다.

```ts
// 이 import은 바인딩이 있으므로 tree-shaking에서 살아남는다
import { Button } from '@fullstack-forge/design-system/components/button'

// 이 import은 바인딩이 없다 — sideEffects: false면 번들러가 제거한다
import '@fullstack-forge/design-system/styles/globals.css'
```

JavaScript 모듈에서 `sideEffects: false`는 올바른 최적화다. 그러나 CSS는 `@import`나 bare import만으로 스타일을 적용하는 **부수 효과 모듈**이다. 바인딩이 없으므로 번들러 입장에서는 "아무것도 사용하지 않는 import"으로 보인다.

**Action** — `sideEffects` 필드는 webpack 4에서 도입되어 현재 Vite(Rolldown), Rollup, esbuild 등 모든 주요 번들러가 인식하는 표준이다. 값의 의미:

| 값                      | 의미                                                        |
| ----------------------- | ----------------------------------------------------------- |
| `false`                 | 모든 모듈에 부수 효과 없음 — 최대 tree-shaking              |
| `true` (또는 필드 없음) | 모든 모듈에 부수 효과 있을 수 있음 — tree-shaking 제한      |
| `["*.css", "*.scss"]`   | 지정된 패턴의 파일만 부수 효과 있음 — 나머지는 tree-shaking |

**Result** — 라이브러리 패키지에서 `sideEffects: false`는 번들 크기를 줄이는 핵심 최적화. 그러나 CSS를 포함하는 패키지에서는 CSS 파일을 반드시 예외로 지정해야 한다. ✅ 2026년 기준 모든 주요 번들러의 표준 동작.

---

## CSS가 부수 효과인 이유 — bare import의 함정

**Problem** — CSS 파일은 JavaScript와 근본적으로 다른 방식으로 동작한다. JS 모듈은 `export`/`import` 바인딩으로 의존 관계가 명시적이지만, CSS는 파일을 import하는 것 자체가 스타일을 적용하는 행위다. 번들러의 tree-shaker는 이 차이를 모른다.

`sideEffects` 선언 없이 CSS를 import하면 일어나는 일:

```css
/* apps/store/src/styles/app.css */
@import 'tailwindcss';
@import '@fullstack-forge/design-system/styles/globals.css';
/*       ↑ 번들러: "바인딩 없음 + sideEffects 미선언 → 제거" */
```

빌드 결과: `globals.css`의 CSS 변수(`--background`, `--foreground`, `--primary` 등)가 누락되어 **모든 shadcn/ui 컴포넌트가 스타일 없이 렌더링**된다. 색상, 간격, 라운드 값이 모두 `undefined`가 되어 레이아웃이 깨진다.

**Action** — `sideEffects` 배열에 CSS 파일 패턴을 명시하면 번들러가 해당 파일을 tree-shaking 대상에서 제외한다:

```jsonc
// packages/design-system/package.json
{
  // JS 모듈은 tree-shaking 가능, CSS만 보존
  "sideEffects": ["./src/styles/**/*.css"],
}
```

배열의 경로는 `package.json` 기준 상대 경로이며, glob 패턴을 지원한다. 일반적인 패턴들:

```jsonc
// 모든 CSS 보존 (넓은 범위)
{ "sideEffects": ["*.css"] }

// 특정 디렉토리만 보존 (정밀한 범위 — 이 프로젝트의 선택)
{ "sideEffects": ["./src/styles/**/*.css"] }
```

**Result** — CSS import이 번들에 포함되어 디자인 토큰과 테마 변수가 정상 적용된다. 동시에 JS 모듈은 여전히 tree-shaking 대상이므로 번들 크기 최적화도 유지된다. ✅ webpack, Vite, Rollup 모두 동일하게 동작.

> **Caveat**: `sideEffects` 배열 경로는 **패키지 내부 소스 파일 경로**를 기준으로 한다. `exports` 필드의 매핑된 경로가 아니라 실제 파일 시스템 경로를 사용해야 한다. 이 프로젝트에서 소비자가 `@fullstack-forge/design-system/styles/globals.css`로 import하지만, `sideEffects`에는 `./src/styles/**/*.css`(소스 경로)를 지정한다.

---

## 이 프로젝트에서의 적용

| 결정                                     | 해결하는 문제                                              |
| ---------------------------------------- | ---------------------------------------------------------- |
| `sideEffects: ["./src/styles/**/*.css"]` | globals.css의 CSS 변수가 tree-shaking으로 삭제되는 것 방지 |
| glob 범위 한정 (`./src/styles/**`)       | JS 모듈의 tree-shaking은 유지하면서 CSS만 보존             |
| 소비자 앱의 `@import` 패턴               | store/admin이 `app.css`에서 디자인 토큰을 한 줄로 가져옴   |

소비자 앱의 CSS import 구조:

```css
/* apps/store/src/styles/app.css */
@import 'tailwindcss';
@import '@fullstack-forge/design-system/styles/globals.css';

/* apps/admin/src/styles/app.css — 동일 패턴 */
@import 'tailwindcss';
@import '@fullstack-forge/design-system/styles/globals.css';
```

`globals.css`에는 shadcn/ui가 사용하는 CSS 변수(색상, 라운드, 간격)가 정의되어 있어, 이 import이 없으면 모든 UI 컴포넌트의 스타일이 깨진다.

---

## 다음 문서

이 토픽의 마지막 문서입니다. [인덱스로 돌아가기](./README.md)
