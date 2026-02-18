import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { Button } from '@fullstack-forge/design-system/components/button'
import { Input } from '@fullstack-forge/design-system/components/input'
import { Label } from '@fullstack-forge/design-system/components/label'
import { readApiError } from '~/lib/api'
import { passwordResetConfirmMutationOptions } from '~/lib/queries/auth'

const passwordUpdateSchema = z
  .object({
    token: z.string().trim().min(1, 'Reset token is required.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string().min(1, 'Confirm password is required.'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Password confirmation does not match.',
  })

type PasswordUpdateFormValues = z.infer<typeof passwordUpdateSchema>

export function PasswordUpdatePage() {
  const navigate = useNavigate()

  return (
    <PasswordUpdatePageContent
      onSuccessNavigate={() => {
        void navigate({ to: '/login' })
      }}
    />
  )
}

type PasswordUpdatePageContentProps = {
  onSuccessNavigate?: () => void
}

export function PasswordUpdatePageContent({
  onSuccessNavigate,
}: Readonly<PasswordUpdatePageContentProps>) {
  const initialToken = useMemo(() => {
    if (typeof window === 'undefined') {
      return ''
    }
    return new URLSearchParams(window.location.search).get('token') ?? ''
  }, [])

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const form = useForm<PasswordUpdateFormValues>({
    resolver: zodResolver(passwordUpdateSchema),
    defaultValues: {
      token: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onSubmit',
  })

  useEffect(() => {
    if (initialToken) {
      form.setValue('token', initialToken)
    }
  }, [form, initialToken])

  const confirmMutation = useMutation({
    ...passwordResetConfirmMutationOptions(),
    onSuccess: async () => {
      setSuccessMessage('Password updated. Please sign in with your new password.')
      setErrorMessage(null)
      onSuccessNavigate?.()
    },
  })

  async function onSubmit(values: PasswordUpdateFormValues): Promise<void> {
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      await confirmMutation.mutateAsync({
        token: values.token.trim(),
        password: values.password,
      })
    } catch (error) {
      const parsed = await readApiError(error)
      if (parsed.error) {
        const details = parsed.code ? ` (${parsed.code})` : ''
        setErrorMessage(parsed.error + details)
      } else {
        setErrorMessage('Password update failed. Please try again.')
      }
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center p-6">
      <h1 className="text-3xl font-semibold">Update password</h1>
      <p className="mt-2 text-sm text-slate-600">
        Enter your reset token and choose a new password.
      </p>

      {errorMessage ? (
        <p role="alert" className="mt-4 rounded bg-rose-100 p-3 text-sm text-rose-900">
          {errorMessage}
        </p>
      ) : null}
      {successMessage ? (
        <p className="mt-4 rounded bg-emerald-100 p-3 text-sm text-emerald-900">{successMessage}</p>
      ) : null}

      <form className="mt-6 flex flex-col gap-3" onSubmit={form.handleSubmit(onSubmit)}>
        <Label className="text-sm font-medium" htmlFor="reset-token">
          Reset token
        </Label>
        <Input
          id="reset-token"
          type="text"
          {...form.register('token')}
          autoComplete="off"
          required
        />
        {form.formState.errors.token?.message ? (
          <p role="alert" className="text-sm text-rose-700">
            {form.formState.errors.token.message}
          </p>
        ) : null}

        <Label className="text-sm font-medium" htmlFor="new-password">
          New password
        </Label>
        <Input
          id="new-password"
          type="password"
          {...form.register('password')}
          autoComplete="new-password"
          required
        />
        {form.formState.errors.password?.message ? (
          <p role="alert" className="text-sm text-rose-700">
            {form.formState.errors.password.message}
          </p>
        ) : null}

        <Label className="text-sm font-medium" htmlFor="confirm-password">
          Confirm password
        </Label>
        <Input
          id="confirm-password"
          type="password"
          {...form.register('confirmPassword')}
          autoComplete="new-password"
          required
        />
        {form.formState.errors.confirmPassword?.message ? (
          <p role="alert" className="text-sm text-rose-700">
            {form.formState.errors.confirmPassword.message}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={confirmMutation.isPending}
          className="mt-2"
        >
          {confirmMutation.isPending ? 'Updating password...' : 'Update password'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        Back to{' '}
        <Link to="/login" className="underline">
          Sign in
        </Link>
      </p>
    </main>
  )
}
