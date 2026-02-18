# Coupling — Detailed Examples

## A. One Responsibility Per Unit

Don't create broad "page state" hooks that manage everything. Split by concern.

### Bad

```ts
export function usePageState() {
  const [query, setQuery] = useQueryParams({
    cardId: NumberParam,
    statementId: NumberParam,
    dateFrom: DateParam,
    dateTo: DateParam,
    statusList: ArrayParam,
  })

  return useMemo(
    () => ({
      values: {
        cardId: query.cardId ?? undefined,
        statementId: query.statementId ?? undefined,
        dateFrom: query.dateFrom == null ? defaultDateFrom : moment(query.dateFrom),
        dateTo: query.dateTo == null ? defaultDateTo : moment(query.dateTo),
        statusList: query.statusList as StatementStatusType[] | undefined,
      },
      controls: {
        setCardId: (cardId: number) => setQuery({ cardId }, 'replaceIn'),
        setStatementId: (statementId: number) => setQuery({ statementId }, 'replaceIn'),
        setDateFrom: (date?: Moment) => setQuery({ dateFrom: date?.toDate() }, 'replaceIn'),
        setDateTo: (date?: Moment) => setQuery({ dateTo: date?.toDate() }, 'replaceIn'),
        setStatusList: (statusList?: StatementStatusType[]) =>
          setQuery({ statusList }, 'replaceIn'),
      },
    }),
    [query, setQuery],
  )
}
```

Problems:

- Modifying any param re-renders all consumers
- Blast radius of changes spans the entire page
- Responsibility grows unbounded as new params are added

### Good

```ts
export function useCardIdQueryParam() {
  const [cardId, _setCardId] = useQueryParam('cardId', NumberParam)
  const setCardId = useCallback((cardId: number) => _setCardId({ cardId }, 'replaceIn'), [])
  return [cardId ?? undefined, setCardId] as const
}
```

Each param gets its own hook: clear name, isolated re-renders, narrow blast radius.

---

## B. Allow Duplication

Don't prematurely abstract code that looks similar but may diverge across pages.

### Bad — Over-abstracted shared hook

```ts
export const useOpenMaintenanceBottomSheet = () => {
  const maintenanceBottomSheet = useMaintenanceBottomSheet()
  const logger = useLogger()

  return async (maintainingInfo: TelecomMaintenanceInfo) => {
    logger.log('maintenance_sheet_opened')
    const result = await maintenanceBottomSheet.open(maintainingInfo)
    if (result) {
      logger.log('maintenance_sheet_notify_clicked')
    }
    closeView()
  }
}
```

Looks clean, but what happens when:

- Page A needs different log events?
- Page B shouldn't close the view after dismissal?
- Page C needs different bottom sheet text?

The hook gains parameters, grows complex, and every change risks breaking all consumers.

### Good — Duplicated but independent

Keep the logic inline in each page. If it's 5-10 lines, duplication is cheaper than coupling.

**Decision criteria for abstracting vs duplicating:**

| Question                                           | If Yes →                           | If No →   |
| -------------------------------------------------- | ---------------------------------- | --------- |
| Will behavior stay identical across all consumers? | Abstract                           | Duplicate |
| Will the abstracted hook grow params over time?    | Duplicate                          | Abstract  |
| Does modifying this affect 3+ pages?               | Duplicate (to reduce blast radius) | Abstract  |

Talk to your team. If behavior is guaranteed to stay identical, abstract. If divergence is likely, duplicate.

---

## C. Eliminate Props Drilling

Props Drilling creates unnecessary coupling between parent and child components.

### Bad — Direct drilling

```tsx
function ItemEditModal({ open, items, recommendedItems, onConfirm, onClose }) {
  const [keyword, setKeyword] = useState('')
  return (
    <Modal open={open} onClose={onClose}>
      <ItemEditBody
        items={items}
        keyword={keyword}
        onKeywordChange={setKeyword}
        recommendedItems={recommendedItems}
        onConfirm={onConfirm}
        onClose={onClose}
      />
    </Modal>
  )
}

function ItemEditBody({ keyword, onKeywordChange, items, recommendedItems, onConfirm, onClose }) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Input value={keyword} onChange={(e) => onKeywordChange(e.target.value)} />
        <Button onClick={onClose}>Close</Button>
      </div>
      <ItemEditList
        keyword={keyword}
        items={items}
        recommendedItems={recommendedItems}
        onConfirm={onConfirm}
      />
    </>
  )
}
```

Problem: `items`, `recommendedItems`, `onConfirm` pass through `ItemEditBody` without being used. Removing `recommendedItems` requires editing all intermediate components.

### Good — Option A: Composition Pattern

```tsx
function ItemEditModal({ open, items, recommendedItems, onConfirm, onClose }) {
  const [keyword, setKeyword] = useState('')
  return (
    <Modal open={open} onClose={onClose}>
      <ItemEditBody keyword={keyword} onKeywordChange={setKeyword} onClose={onClose}>
        <ItemEditList
          keyword={keyword}
          items={items}
          recommendedItems={recommendedItems}
          onConfirm={onConfirm}
        />
      </ItemEditBody>
    </Modal>
  )
}

function ItemEditBody({ children, keyword, onKeywordChange, onClose }) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Input value={keyword} onChange={(e) => onKeywordChange(e.target.value)} />
        <Button onClick={onClose}>Close</Button>
      </div>
      {children}
    </>
  )
}
```

`ItemEditBody` no longer passes through props it doesn't use.

### Good — Option B: Context API (for deep trees)

```tsx
function ItemEditModal({ open, onConfirm, onClose }) {
  const [keyword, setKeyword] = useState('')
  return (
    <Modal open={open} onClose={onClose}>
      <ItemEditBody keyword={keyword} onKeywordChange={setKeyword} onClose={onClose}>
        <ItemEditList keyword={keyword} onConfirm={onConfirm} />
      </ItemEditBody>
    </Modal>
  )
}

function ItemEditList({ keyword, onConfirm }) {
  const { items, recommendedItems } = useItemEditModalContext()
  // Uses context instead of props drilling
  return <>{/* ... */}</>
}
```

### Resolution Order

1. **First**: Try composition pattern (`children` prop)
2. **Then**: Restructure component tree to reduce depth
3. **Last resort**: Use Context API

Props are valuable — they make component interfaces explicit. Only eliminate drilling when intermediate components pass props they don't use.
