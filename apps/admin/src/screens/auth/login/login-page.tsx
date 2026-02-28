import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { Button } from '@fullstack-forge/design-system/components/button'
import { Input } from '@fullstack-forge/design-system/components/input'
import { Label } from '@fullstack-forge/design-system/components/label'
import { readApiError } from '~/lib/api/core'
import { authQueryKeys, loginMutationOptions } from '~/lib/queries/auth'
import type { MeResponse } from '~/lib/queries/auth'

const loginSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@fullstack-forge.local',
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
        setErrorMessage('Login failed. Please check your credentials.')
      }
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center p-6">
      <h1 className="text-3xl font-semibold">Admin Sign in</h1>
      <p className="mt-2 text-sm text-slate-600">Sign in to access the admin panel.</p>

      {errorMessage ? (
        <p role="alert" className="mt-4 rounded bg-rose-100 p-3 text-sm text-rose-900">
          {errorMessage}
        </p>
      ) : null}

      <form className="mt-6 flex flex-col gap-3" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" required {...form.register('email')} />
        {form.formState.errors.email?.message ? (
          <p role="alert" className="text-sm text-rose-700">
            {form.formState.errors.email.message}
          </p>
        ) : null}

        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          {...form.register('password')}
        />
        {form.formState.errors.password?.message ? (
          <p role="alert" className="text-sm text-rose-700">
            {form.formState.errors.password.message}
          </p>
        ) : null}

        <Button type="submit" disabled={loginMutation.isPending} className="mt-2">
          {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </main>
  )
}
