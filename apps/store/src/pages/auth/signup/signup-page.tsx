import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { Button } from '@fullstack-forge/design-system/components/button'
import { Input } from '@fullstack-forge/design-system/components/input'
import { Label } from '@fullstack-forge/design-system/components/label'
import { readApiError } from '~/@shared/api'
import type { MeResponse } from '~/@shared/queries/auth'
import { authQueryKeys, signupMutationOptions } from '~/@shared/queries/auth'

const signupSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요.'),
  email: z.string().email('유효하지 않은 이메일 주소입니다.'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다.'),
})

type SignupFormValues = z.infer<typeof signupSchema>

export function SignupPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: 'New Customer',
      email: 'new-customer@fullstack-forge.local',
      password: 'Passw0rd!',
    },
    mode: 'onSubmit',
  })

  const signupMutation = useMutation({
    ...signupMutationOptions(),
    onSuccess: async (result) => {
      queryClient.setQueryData<MeResponse>(authQueryKeys.me, {
        user: result.user,
      })
      void navigate({ to: '/' })
    },
  })

  async function onSubmit(values: SignupFormValues): Promise<void> {
    setErrorMessage(null)

    try {
      await signupMutation.mutateAsync(values)
    } catch (error) {
      const parsed = await readApiError(error)
      if (parsed.error) {
        const details = parsed.code ? ` (${parsed.code})` : ''
        setErrorMessage(parsed.error + details)
      } else {
        setErrorMessage('회원가입에 실패했습니다. 다시 시도해주세요.')
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
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">회원가입</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            이메일과 비밀번호로 계정을 만드세요.
          </p>
        </div>

        {errorMessage ? (
          <p
            role="alert"
            className="mt-5 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
          >
            {errorMessage}
          </p>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="name">이름</Label>
            <Input id="name" type="text" autoComplete="name" required {...form.register('name')} />
            {form.formState.errors.name?.message ? (
              <p role="alert" className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              {...form.register('email')}
            />
            {form.formState.errors.email?.message ? (
              <p role="alert" className="text-xs text-destructive">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              {...form.register('password')}
            />
            {form.formState.errors.password?.message ? (
              <p role="alert" className="text-xs text-destructive">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          <Button type="submit" disabled={signupMutation.isPending} className="h-11 w-full">
            {signupMutation.isPending ? '가입 중...' : '회원가입'}
          </Button>
        </form>

        <div className="mt-8 space-y-2 text-center text-sm text-muted-foreground">
          <p>
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="font-medium text-foreground underline underline-offset-2">
              로그인
            </Link>
          </p>
          <p>
            <Link
              to="/"
              className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              홈으로 돌아가기
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
