---
name: learn-writer
description: Generate deep-dive docs/learn documentation for project technology stacks by following the exact structure used in docs/learn/typescript. Use when users want to understand why a stack choice was made and how its configuration works, with Korean output organized as numbered documents and topic indexes.
version: 0.1.0
triggers: learn docs, deep dive stack docs, docs/learn, 기술 스택 왜, configuration rationale
---

# Learn Writer

Generate textbook-style `docs/learn` documentation that explains the rationale behind technology choices.

Always mirror the established TypeScript pattern in `docs/learn/typescript/`.

## Scope

- Write Korean learning documents under `docs/learn/{topic}/`
- Keep `docs/harness` as recipe-style guidance and `docs/learn` as rationale-style explanation
- Produce three outputs together: numbered documents, topic `README.md`, parent `docs/learn/README.md` update

## Output Contract

- Numbered docs: `01-...md`, `02-...md`, `03-...md`, ... in Korean
- Topic index: `docs/learn/{topic}/README.md` with sequence table and related docs
- Parent index update: add topic row to `docs/learn/README.md` structure table
- No custom format: follow templates in `references/`

## Workflow

### Phase 1: Topic Scoping

1. Identify the technology to document and normalize topic slug.
2. Map relevant project files:
   - Config files (`*.json`, `*.yaml`, `*.ts`, `*.js`)
   - Build/test/runtime integration points
   - Related `docs/harness/*` and `docs/execution/*`
3. Plan document split:
   - Group by conceptual units (architecture, strictness/safety, module/runtime, build/output, monorepo/integration)
   - Define numbered file list and one core question per file
4. Confirm chain order so each document naturally leads to the next.

Deliverable:
- A numbered outline with filename, core question, and source files per document.

### Phase 2: Research

1. Read actual repository configuration and source references for the topic.
2. Collect current best-practice rationale (2026 context) using web research when needed.
3. For each option/decision, collect PAR material:
   - **Problem**: What specific pain does this solve? What breaks without it?
   - **Action**: What does it do? Why this choice over alternatives?
   - **Result**: Concrete outcome. Current-year appropriateness.
   - **Caveat** (if any): Trade-offs, version constraints, interactions with other options.

Rule:
- Do not document only what an option is; explain why this project should keep, change, or defer it.

### Phase 3: Document Generation

1. Generate each numbered document from `references/document-template.md`.
2. Document-level structure:
   - `핵심 질문` -> `한 줄 답` -> `현재 설정` -> PAR blocks -> `이 프로젝트에서의 적용` -> `다음 문서`
3. For each option/decision, write a self-contained **PAR block**:
   - **Problem**: What goes wrong without this option? Show broken code or concrete pain.
   - **Action**: What the option does and why this project chose it. Show working code.
   - **Result**: Concrete outcome + current-year appropriateness assessment.
   - **Caveat** (optional): Only when a real trade-off, gotcha, or interaction with other options exists. Omit if there is nothing noteworthy.
4. Each PAR block must be independently readable — a reader should understand one option without reading the whole document.
5. Generate topic index from `references/index-template.md`.
6. Update parent index using `references/parent-index-template.md`.

Language rule:
- All generated learn documents must be Korean.

### Phase 4: Cross-Reference

1. Add `연관 문서` links to relevant:
   - `docs/harness/*` recipe docs
   - `docs/execution/*` verification docs when applicable
2. Ensure each numbered document has a valid `다음 문서` chain.
3. Keep topic README links synchronized with actual filenames.
4. Keep parent learn index row aligned with topic README path and doc count.

### Phase 5: Verification

Run final checks before finishing:

1. Link integrity
   - All relative links resolve
   - No broken `다음 문서` or README table links
2. Structure integrity
   - Numbering continuity (`01`, `02`, `03`...)
   - Required sections exist in every numbered doc
3. Language integrity
   - Korean prose is consistent and natural
   - Terminology consistency across documents
4. Pattern integrity
   - Matches TypeScript learn pattern, no novel layout introduced

## Quality Rules

- Use placeholders/templates during drafting, then replace with topic-specific content
- Keep rationale dense and practical; avoid generic textbook filler
- Use project paths and config snippets as evidence
- Prefer one concept per major section
- Keep `SKILL.md` concise; put fixed structures in `references/`

## Reference Files

- Single document template: [references/document-template.md](references/document-template.md)
- Topic README template: [references/index-template.md](references/index-template.md)
- Parent learn index update template: [references/parent-index-template.md](references/parent-index-template.md)
