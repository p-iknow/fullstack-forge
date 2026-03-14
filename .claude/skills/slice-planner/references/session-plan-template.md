# Session Plan Template

All session plan files MUST follow this structure. Replace `{placeholders}` with actual values.

---

```markdown
# {Slice Name} — {Layer} Session

## Context

- **현재 상태**: {What already exists. List file paths of relevant existing code.}
- **패턴 레퍼런스**:
  - {Pattern 1}: `{exact file path}` ({what to learn from it})
  - {Pattern 2}: `{exact file path}` ({what to learn from it})
- **PRD 근거**: `docs/01-prd/{domain}/01-overview.md §{section}`, `02-api.md` {etc.}

## Scope

**이 세션에서 하는 것**:
- {Specific deliverable 1}
- {Specific deliverable 2}

**이 세션에서 하지 않는 것**:
- {Deferred item 1} ({which session handles it})
- {Deferred item 2} ({which session handles it})

**생성할 파일**:
- `{full/path/to/file1.ts}`
- `{full/path/to/file2.ts}`

**수정할 파일**:
- `{full/path/to/existing-file.ts}` ({what change})

## Progressive Tasks

### 1. {Task title}

파일: `{full/path/to/file.ts}`

{Code structure showing types, function signatures, key logic.}
{For handlers: numbered pseudocode steps (1. validate → 2. query → 3. return).}

### 2. {Task title}

...

## Data Contract

### Endpoints (api-spec / backend sessions)

| Method | Path | Request | 성공 | 에러 코드 |
|--------|------|---------|------|-----------|
| {GET} | {/api/store/resource} | {—} | {200 responseSchema} | {401, 404} |

### Error Codes (api-spec / backend sessions)

| code | 의미 | HTTP |
|------|------|------|
| `{error_code}` | {description} | {400} |

### DB Columns (db-schema sessions)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| {id} | {uuid} | {PK, defaultRandom} | {description} |

### Business Rules (backend sessions)

| 규칙 | 값 | 검증 시점 |
|------|------|-----------|
| {rule name} | {value from PRD} | {when enforced} |

### Component Tree (store-ui / admin-ui sessions)

```
{PageComponent}
├── {Loading} → {Skeleton description}
├── {Error} → {Error handling description}
├── {Empty} → {Empty state description}
└── {Content}
    ├── {SubComponent1}
    │   └── {details}
    └── {SubComponent2}
```

## Verification

```bash
{exact command 1}
{exact command 2}
```

## Exit Criteria

- [ ] {Testable outcome 1}
- [ ] {Testable outcome 2}
- [ ] typecheck/build/test 통과
```

---

## Section Rules

| Section | Required For | Notes |
|---------|-------------|-------|
| Context | All sessions | Always include pattern references |
| Scope | All sessions | Always list files to create AND modify |
| Progressive Tasks | All sessions | Numbered, with file paths and code structure |
| Endpoints table | api-spec, backend | Method + path + all error codes |
| Error Codes table | api-spec, backend | Every error code explicitly listed |
| DB Columns table | db-schema | Every column with type and constraints |
| Business Rules | backend | Values from PRD with source citation |
| Component Tree | store-ui, admin-ui | Indented hierarchy showing layout |
| Verification | All sessions | Exact bash commands |
| Exit Criteria | All sessions | Checkbox list, every item testable |
