---
name: learn-writer
description: Generate deep-dive docs/learn documentation for project technology stacks by following the exact structure used in docs/learn/typescript. Use when users want to understand why a stack choice was made and how its configuration works, with Korean output organized as numbered documents and topic indexes.
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

## Output Language

All generated learn documents MUST be written in Korean. Templates in `references/` use English placeholders — translate all section headers and prose to Korean when generating output.

**Section header mapping** (template English → output Korean):

| Template Header             | Korean Output           |
| --------------------------- | ----------------------- |
| Core Question               | 핵심 질문               |
| One-Line Answer             | 한 줄 답                |
| Current Config              | 현재 설정               |
| Current Approach            | 현재 접근 방식          |
| Current Flow                | 현재 흐름               |
| Application in This Project | 이 프로젝트에서의 적용  |
| Source Decision             | 근거 문서               |
| Next Document               | 다음 문서               |
| Document Sequence           | 문서 순서               |
| Prerequisites               | 전제 지식               |
| Project Config Files        | 이 프로젝트의 설정 파일 |
| Related Docs                | 연관 문서               |

Greenfield placeholder (when config does not exist yet):

- English template: `Current Config: N/A (not yet implemented)`
- Korean output: `현재 설정: 없음(미구현)`

## Workflow

### Phase 1: Topic Scoping

1. Identify the technology to document and normalize topic slug.
2. Map relevant project files:
   - Config files (`*.json`, `*.yaml`, `*.ts`, `*.js`)
   - Build/test/runtime integration points
   - Related `docs/architecture/*` implementation docs
3. Classify each document's **decision-unit mode**:
   - **Option** — a single config key or flag (e.g., `strict`, `noEmit`). Use "Current Config" code block + code examples in PAR.
   - **Pattern** — a design pattern or composition (e.g., route grouping, middleware chain). Replace "Current Config" with "Current Approach" showing code pointers.
   - **Workflow** — a multi-step process (e.g., migration strategy, deployment flow). Replace "Current Config" with "Current Flow" showing a step diagram or sequence.
4. Plan document split:
   - Group by conceptual units (architecture, strictness/safety, module/runtime, build/output, monorepo/integration)
   - Define numbered file list, one core question per file, and decision-unit mode per file
5. Confirm chain order so each document naturally leads to the next.

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

PAR Applicability Rule:

- Use PAR **only** for true decision/comparison points (e.g., "왜 A 대신 B", "이 설정을 유지/변경/보류할 이유").
- For descriptive sections (terminology, protocol field definitions, sequence walkthroughs, runbooks, audit field catalogs), use explanatory prose + tables/diagrams.
- Do **not** force Problem/Action/Result labels onto every subsection.

Rules:

- Do not document only what an option is; explain why this project should keep, change, or defer it.
- If a config file or setting does not exist yet (greenfield/planned), use the greenfield placeholder (see Output Language section), describe the planned state with references to the decision source (ADR/harness), and NEVER fabricate snippets.

### Phase 3: Document Generation

1. Generate each numbered document from `references/document-template.md`.
2. Document-level structure:
   - Core Question → One-Line Answer → context section (varies by mode) → PAR blocks → Application in This Project → Next Document
   - Context section by mode: **Option** → Current Config (config snippet), **Pattern** → Current Approach (code pointers), **Workflow** → Current Flow (step diagram)
3. For each decision unit, write a self-contained **PAR block**:
   - **Problem**: What goes wrong without this? Show broken code, concrete pain, or failed workflow.
   - **Action**: What it does and why this project chose it. Show working code when meaningful; config-only or conceptual blocks are acceptable when code is not applicable.
   - **Result**: Concrete outcome + current-year appropriateness assessment.
   - **Caveat** (optional): Only when a real trade-off, gotcha, or interaction with other decisions exists. Omit entirely if there is nothing noteworthy.
4. Each PAR block must be independently readable — a reader should understand one decision without reading the whole document.
5. Mix formats intentionally within one document when needed:
   - Decision-heavy subsection → PAR
   - Explanation-heavy subsection → narrative/table/diagram (non-PAR)
6. Do not rewrite purely factual definitions into artificial PAR if no real trade-off exists.
7. For explanation-heavy sections, include concrete examples (code snippets, request/response samples, mini-scenarios) whenever it improves comprehension.
8. When drawing flows, sequences, or process diagrams, use Mermaid fenced blocks (` ```mermaid `) consistently.
9. For auth/payment/order workflows with branching, pair diagrams in this order:
   - **SequenceDiagram**: interaction order and ownership (who calls whom)
   - **Flowchart**: detailed conditional branches and error code outcomes
10. In SequenceDiagram, when a branch depends on DB/cache/provider lookup, always show the return message before `alt`:

- Example pattern: `API->>DB: ...` then `DB-->>API: exists=true/false` then `alt ...`

11. Do not rely on implicit branches. Prefer explicit guards and `else` labels so readers can map conditions to outcomes quickly.
12. Use parser-safe Mermaid node labels in flowcharts:

- Avoid parentheses-heavy labels inside nodes (e.g., prefer `createSession userId` over `createSession(userId)`)
- Keep labels short and ASCII-friendly where possible to reduce renderer variance

13. Keep SequenceDiagram and Flowchart synchronized:

- Same endpoint/action names
- Same branch conditions
- Same success/error result codes

14. Generate topic index from `references/index-template.md`.
15. Update parent index using `references/parent-index-template.md`.

### Mermaid Branching Standard (Required)

Use this standard whenever documenting branching workflows:

1. Start with a concise SequenceDiagram (happy path + key external calls).
2. Add a `상세 분기(Flowchart):` block immediately below it.
3. In SequenceDiagram, every data-dependent `alt` must have a preceding response arrow from the dependency.
4. In Flowchart, express each decision as `condition?` and include explicit fail/success outputs with status or result code.
5. If an error can happen at multiple layers (validation, DB, cache, provider), model each layer as a separate decision node.

### Phase 4: Cross-Reference

1. Add "Related Docs" section to the **topic README only** (not in numbered docs) linking to:
   - `docs/architecture/*/` implementation docs when applicable
2. In numbered docs, add "Source Decision" ADR traceability line (see template) when an ADR covers the topic. Omit if no ADR exists.
3. Ensure each numbered document has a valid "Next Document" chain.
4. Keep topic README links synchronized with actual filenames.
5. Keep parent learn index row aligned with topic README path and doc count.

### Phase 5: Verification

Run final checks before finishing:

1. Link integrity
   - All relative links resolve
   - No broken "Next Document" or README table links
2. Structure integrity
   - Numbering continuity (`01`, `02`, `03`...)
   - Required sections exist in every numbered doc
3. Language integrity
   - Korean prose is consistent and natural
   - Terminology consistency across documents
   - Section headers match the Korean mapping table
4. Pattern integrity
   - Matches TypeScript learn pattern, no novel layout introduced

## Quality Rules

- Use placeholders/templates during drafting, then replace with topic-specific content
- Keep rationale dense and practical; avoid generic textbook filler
- Use project paths and config snippets as evidence
- Prefer one concept per major section
- Keep `SKILL.md` concise; put fixed structures in `references/`
- PAR is a tool, not a blanket requirement: apply selectively by subsection purpose
- Prefer explanation with examples over abstract prose when onboarding value is high
- Use Mermaid for all flow/sequence/state diagrams (avoid ad-hoc ASCII flowcharts)

## Examples

**Good PAR block** (self-contained, problem-first, project-grounded):

```markdown
## `"noEmit": true` — tsc as type checker only

**Problem** — If tsc handles the build, it cannot do HMR, CSS/asset processing, or bundling ...

**Action** — `noEmit: true` completely disables tsc output. Type checking only ...

**Result** — Standard pattern for bundler-based projects. Required.
```

Note: The actual output would be in Korean. This example shows the structural pattern.

**Bad PAR block** (generic, no project context):

```markdown
## noEmit

Setting noEmit to true means tsc does not generate files.
This is useful when you only want type checking.
```

## Troubleshooting

| Symptom                                   | Cause                                              | Fix                                                                  |
| ----------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------- |
| Broken "Next Document" link               | Filename changed after chain was set               | Re-verify Phase 5 step 1; update all "Next Document" links           |
| Numbering gap (01, 02, 04)                | Document removed without renumbering               | Renumber all docs and update README table                            |
| "Current Config" shows fabricated config  | Greenfield topic with no config yet                | Use greenfield placeholder with ADR/harness reference                |
| Parent index row duplicated               | Agent appended instead of checking existing rows   | Check `docs/learn/README.md` for existing topic row before inserting |
| Template mode mismatch                    | Used "Current Config" for a Pattern/Workflow topic | Re-classify decision-unit mode (Phase 1 step 3)                      |
| Mermaid parse error near branch node      | Node label used parser-sensitive symbols           | Simplify node label text (remove `()`, complex inline literals)      |
| Branch intent unclear in sequence diagram | Missing dependency return before `alt`             | Add `DB/Redis/Provider -->> API: result` immediately before `alt`    |

## Reference Files

- Single document template: [references/document-template.md](references/document-template.md)
- Topic README template: [references/index-template.md](references/index-template.md)
- Parent learn index update template: [references/parent-index-template.md](references/parent-index-template.md)
