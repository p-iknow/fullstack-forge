import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { Button } from '@fullstack-forge/design-system/components/button'
import { Input } from '@fullstack-forge/design-system/components/input'
import { Label } from '@fullstack-forge/design-system/components/label'
import { readApiError } from '~/lib/api'
import type { MeResponse } from '~/lib/queries/auth'
import { authQueryKeys, signupMutationOptions } from '~/lib/queries/auth'

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
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
        setErrorMessage('Sign up failed. Please try again.')
      }
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center p-6">
      <h1 className="text-3xl font-semibold">Create account</h1>
      <p className="mt-2 text-sm text-slate-600">
        Create your customer account with email and password.
      </p>

      {errorMessage ? (
        <p role="alert" className="mt-4 rounded bg-rose-100 p-3 text-sm text-rose-900">
          {errorMessage}
        </p>
      ) : null}

      <form className="mt-6 flex flex-col gap-3" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Label htmlFor="name">Name</Label>
        <Input id="name" type="text" autoComplete="name" required {...form.register('name')} />
        {form.formState.errors.name?.message ? (
          <p role="alert" className="text-sm text-rose-700">
            {form.formState.errors.name.message}
          </p>
        ) : null}

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
          autoComplete="new-password"
          required
          {...form.register('password')}
        />
        {form.formState.errors.password?.message ? (
          <p role="alert" className="text-sm text-rose-700">
            {form.formState.errors.password.message}
          </p>
        ) : null}

        <Button type="submit" disabled={signupMutation.isPending} className="mt-2">
          {signupMutation.isPending ? 'Creating account...' : 'Sign up with Email'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        Already have an account?{' '}
        <Link to="/login" className="underline">
          Sign in
        </Link>
      </p>
      <p className="mt-2 text-sm text-slate-600">
        Back to{' '}
        <Link to="/" className="underline">
          Home
        </Link>
      </p>
    </main>
  )
}
