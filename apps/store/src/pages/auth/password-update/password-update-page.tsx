import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { Button } from '@fullstack-forge/design-system/components/button'
import { Input } from '@fullstack-forge/design-system/components/input'
import { Label } from '@fullstack-forge/design-system/components/label'
import { readApiError } from '~/@shared/api'
import { passwordResetConfirmMutationOptions } from '~/@shared/queries/auth'

const passwordUpdateSchema = z
  .object({
    token: z.string().trim().min(1, '재설정 토큰을 입력해주세요.'),
    password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다.'),
    confirmPassword: z.string().min(1, '비밀번호 확인을 입력해주세요.'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: '비밀번호가 일치하지 않습니다.',
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
      setSuccessMessage('비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.')
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
        setErrorMessage('비밀번호 변경에 실패했습니다. 다시 시도해주세요.')
      }
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <Link to="/" className="text-lg font-bold tracking-tight text-foreground">
            FORGE STORE
          </Link>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">비밀번호 재설정</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            재설정 토큰과 새 비밀번호를 입력하세요.
          </p>
        </div>

        {errorMessage ? (
          <p role="alert" className="mt-5 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}
        {successMessage ? (
          <p className="mt-5 rounded-lg bg-primary/10 p-3 text-sm text-primary">{successMessage}</p>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="reset-token">재설정 토큰</Label>
            <Input
              id="reset-token"
              type="text"
              {...form.register('token')}
              autoComplete="off"
              required
            />
            {form.formState.errors.token?.message ? (
              <p role="alert" className="text-xs text-destructive">
                {form.formState.errors.token.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-password">새 비밀번호</Label>
            <Input
              id="new-password"
              type="password"
              {...form.register('password')}
              autoComplete="new-password"
              required
            />
            {form.formState.errors.password?.message ? (
              <p role="alert" className="text-xs text-destructive">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">비밀번호 확인</Label>
            <Input
              id="confirm-password"
              type="password"
              {...form.register('confirmPassword')}
              autoComplete="new-password"
              required
            />
            {form.formState.errors.confirmPassword?.message ? (
              <p role="alert" className="text-xs text-destructive">
                {form.formState.errors.confirmPassword.message}
              </p>
            ) : null}
          </div>

          <Button type="submit" disabled={confirmMutation.isPending} className="h-11 w-full">
            {confirmMutation.isPending ? '변경 중...' : '비밀번호 변경'}
          </Button>
        </form>

        <div className="mt-8 space-y-2 text-center text-sm text-muted-foreground">
          <p>
            <Link to="/login" className="font-medium text-foreground underline underline-offset-2">
              로그인으로 돌아가기
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
