# Motion and Accessibility Supplement

Apply these rules to preserve UX quality while staying WCAG 2.2 AA aligned.

## Motion Rules

- Motion should explain state change or provide clear feedback — decorative motion adds load time and distraction without helping the user.
- Typical durations: 150ms to 400ms.
- Prefer transform and opacity transitions — they run on the compositor thread and avoid costly layout recalculations.
- Avoid long-running, distracting, or autoplay-heavy effects.

## Reduced Motion Pattern

Some users experience motion sickness or vestibular disorders. Always include a reduced-motion fallback so the app remains usable for everyone.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

When possible, replace movement-heavy transitions with subtle opacity transitions rather than removing all visual feedback.

Use this global pattern only when the project does not already provide one. For new component-level motion, prefer Tailwind's `motion-reduce:*` utilities.

## Focus and Keyboard Baseline

Focus indicators are the only way keyboard users know where they are — removing them silently breaks navigation for a significant user group.

- Use `:focus-visible` for keyboard-specific focus indication (avoids showing focus rings on mouse clicks).
- Ensure users can complete key flows with keyboard only.
- Test tab order to confirm it follows visual reading order.

## State Coverage Checklist

For interactive components, verify each applicable state is handled:

| State            | When to include                                |
| ---------------- | ---------------------------------------------- |
| Default          | Always                                         |
| Hover            | Always for interactive elements                |
| Active / pressed | Buttons, links, toggles                        |
| Focus-visible    | Always for interactive elements                |
| Disabled         | When the element can be disabled               |
| Loading          | Where async operations exist                   |
| Error            | Where validation or request failures can occur |
| Empty            | Where no-data cases exist                      |

## Color and Theme Checks

- Verify light and dark readability for all text and interactive controls.
- Check contrast at least to WCAG AA minimum (4.5:1 for normal text, 3:1 for large text).
- Keep token-driven theming in `globals.css` as the source of truth — never hardcode colors in components.
