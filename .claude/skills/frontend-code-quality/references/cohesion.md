# Cohesion — Detailed Examples

## A. Co-Locate Co-Modified Files

Use domain-based directories instead of type-based. Code that changes together should live together.

### Bad — Type-based structure

```
└─ src
   ├─ components/    # All components from all features
   ├─ constants/
   ├─ containers/
   ├─ contexts/
   ├─ remotes/
   ├─ hooks/          # All hooks from all features
   ├─ utils/
   └─ ...
```

Problems:

- Can't see which code depends on which
- Deleting a feature leaves orphaned files across directories
- Directories grow to 100+ files as project scales

### Good — Domain-based structure

```
└─ src
   ├─ components/     # Truly shared across all domains
   ├─ hooks/
   ├─ utils/
   └─ domains/
      ├─ Domain1/
      │  ├─ components/
      │  ├─ hooks/
      │  ├─ utils/
      │  └─ ...
      └─ Domain2/
         ├─ components/
         ├─ hooks/
         ├─ utils/
         └─ ...
```

Benefits:

- Cross-domain imports are immediately visible as a code smell:
  ```ts
  import { useFoo } from '../../../Domain2/hooks/useFoo' // Obvious violation
  ```
- Deleting a feature = deleting one directory
- Dependencies are structurally enforced

---

## B. Eliminate Magic Numbers (Cohesion View)

Magic numbers break cohesion because changing the source value (e.g., animation duration) doesn't automatically update all dependent code.

### Bad

```ts
async function onLikeClick() {
  await postLike(url)
  await delay(300) // If animation changes to 500ms, this silently breaks
  await refetchPostLike()
}
```

If the animation duration changes from 300ms to 500ms elsewhere, this delay won't update — the code silently breaks because co-dependent values aren't co-located.

### Good

```ts
const ANIMATION_DELAY_MS = 300

async function onLikeClick() {
  await postLike(url)
  await delay(ANIMATION_DELAY_MS)
  await refetchPostLike()
}
```

Named constant serves as a single source of truth. Change it once, all usage sites update.

---

## C. Form Cohesion — Field-Level vs Form-Level

Choose the cohesion level based on how form fields change together.

### Field-Level Cohesion

Each field owns its validation independently. Best when fields are reusable and independently validated.

```tsx
export function Form() {
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm({
    defaultValues: { name: '', email: '' },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('name', {
          validate: (value) => (value.trim() === '' ? 'Name is required.' : ''),
        })}
      />
      {errors.name && <p>{errors.name.message}</p>}

      <input
        {...register('email', {
          validate: (value) => {
            if (value.trim() === '') return 'Email is required.'
            if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value))
              return 'Invalid email address.'
            return ''
          },
        })}
      />
      {errors.email && <p>{errors.email.message}</p>}

      <button type="submit">Submit</button>
    </form>
  )
}
```

**Use when**: Independent validation, reusable fields, async per-field checks.

### Form-Level Cohesion

All validation lives in one schema. Best when fields are tightly coupled as one business unit.

```tsx
const schema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().min(1, 'Email is required.').email('Invalid email address.'),
})

export function Form() {
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm({
    defaultValues: { name: '', email: '' },
    resolver: zodResolver(schema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <p>{errors.name.message}</p>}
      <input {...register('email')} />
      {errors.email && <p>{errors.email.message}</p>}
      <button type="submit">Submit</button>
    </form>
  )
}
```

**Use when**: Single business function (payment, shipping), wizard/step forms, inter-field dependencies (password confirmation, total calculation).

### Decision Guide

| Signal                         | Choose      |
| ------------------------------ | ----------- |
| Fields independently validated | Field-level |
| Fields reused across forms     | Field-level |
| All fields = one business unit | Form-level  |
| Step-by-step wizard            | Form-level  |
| Fields depend on each other    | Form-level  |
