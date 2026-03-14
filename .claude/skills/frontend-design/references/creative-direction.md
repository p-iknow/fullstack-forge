# Creative Direction Supplement

Use this reference when users want stronger visual identity in addition to production quality.

This skill remains quality-first. For highly experimental visual exploration, pair with `frontend-ui-ux`.

## Anti-Slop Guardrails

Generic-looking output undermines user trust and brand identity. These guardrails help produce UI that feels intentional rather than interchangeable.

- Default to existing project font tokens (`--font-sans`, `--font-heading`, `--font-mono`) unless the user explicitly requests typography changes.
- Avoid one-color flat backgrounds for hero-level sections — even subtle gradients or texture add depth.
- Keep visual choices tied to product context (e.g., an e-commerce store should feel trustworthy, not playful).

## Style Spectrum

Pick one clear direction per screen instead of mixing many styles. Each direction works best in specific product contexts:

- **Minimalism**: Restrained surfaces, dense information clarity. Good for dashboards, admin panels, data-heavy views.
- **Editorial**: Strong typographic hierarchy and asymmetry. Good for content-driven pages, blogs, landing pages.
- **Glass-influenced**: Selective blur and layered transparency for focal areas. Good for modern SaaS, creative tools.
- **Brutalist accents**: Bold borders, high contrast blocks. Good for campaign surfaces, limited-time promotions.
- **Organic**: Softer shapes and natural tone ranges. Good for wellness, lifestyle, or community products.

## Practical Pairing Rule

- Use `frontend-design` for token consistency, accessibility, and state coverage.
- Add `frontend-ui-ux` when the user explicitly asks for signature aesthetics, bold art direction, or unconventional layout voice.
