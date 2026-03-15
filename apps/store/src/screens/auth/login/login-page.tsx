import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { Button, buttonVariants } from '@fullstack-forge/design-system/components/button'
import { Input } from '@fullstack-forge/design-system/components/input'
import { Label } from '@fullstack-forge/design-system/components/label'
import { readApiError } from '~/lib/api'
import { authQueryKeys, loginMutationOptions } from '~/lib/queries/auth'
import type { MeResponse } from '~/lib/queries/auth'

const googleStartUrl = '/api/auth/oauth/google/start?redirect=/auth/callback/success'
const kakaoStartUrl = '/api/auth/oauth/kakao/start?redirect=/auth/callback/success'

const loginSchema = z.object({
  email: z.string().email('유효하지 않은 이메일 주소입니다.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'customer@fullstack-forge.local',
      password: 'Passw0rd!',
    },
    mode: 'onSubmit',
  })

  const loginMutation = useMutation({
    ...loginMutationOptions(),
    onSuccess: async (result) => {
      queryClient.setQueryData<MeResponse>(authQueryKeys.me, {
        user: result.user,
      })
      void navigate({ to: '/' })
      setErrorMessage(`${result.user.email}로 로그인되었습니다`)
    },
  })

  async function onSubmit(values: LoginFormValues): Promise<void> {
    setErrorMessage(null)

    try {
      await loginMutation.mutateAsync(values)
    } catch (error) {
      const parsed = await readApiError(error)
      if (parsed.error) {
        const details = parsed.code ? ` (${parsed.code})` : ''
        setErrorMessage(parsed.error + details)
      } else {
        setErrorMessage('로그인에 실패했습니다. 인증 정보를 확인해주세요.')
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
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">로그인</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            이메일 또는 소셜 계정으로 로그인하세요.
          </p>
        </div>

        {errorMessage ? (
          <p role="alert" className="mt-5 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}
        {loginMutation.isSuccess ? (
          <p className="mt-5 rounded-lg bg-primary/10 p-3 text-sm text-primary">로그인 완료.</p>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">이메일</Label>
            <Input id="email" type="email" autoComplete="email" required {...form.register('email')} />
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
              autoComplete="current-password"
              required
              {...form.register('password')}
            />
            {form.formState.errors.password?.message ? (
              <p role="alert" className="text-xs text-destructive">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          <Button type="submit" disabled={loginMutation.isPending} className="h-11 w-full">
            {loginMutation.isPending ? '로그인 중...' : '이메일로 로그인'}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-muted/30 px-2 text-muted-foreground">또는</span>
          </div>
        </div>

        <div className="grid gap-2">
          <a className={buttonVariants({ variant: 'outline' }) + ' h-11 w-full'} href={googleStartUrl}>
            Google로 계속하기
          </a>
          <a className={buttonVariants({ variant: 'outline' }) + ' h-11 w-full'} href={kakaoStartUrl}>
            Kakao로 계속하기
          </a>
        </div>

        <div className="mt-8 space-y-2 text-center text-sm text-muted-foreground">
          <p>
            계정이 없으신가요?{' '}
            <Link to="/signup" className="font-medium text-foreground underline underline-offset-2">
              회원가입
            </Link>
          </p>
          <p>
            <Link to="/password-update" className="text-muted-foreground underline underline-offset-2 hover:text-foreground">
              비밀번호 재설정
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
