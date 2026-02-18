import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { readApiError } from '~/lib/api'
import type { MeResponse } from '~/lib/queries/auth'
import { authQueryKeys, signupMutationOptions } from '~/lib/queries/auth'

export const Route = createFileRoute('/signup')({
  component: SignupPage,
})

function SignupPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [name, setName] = useState('New Customer')
  const [email, setEmail] = useState('new-customer@fullstack-forge.local')
  const [password, setPassword] = useState('Passw0rd!')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const signupMutation = useMutation({
    ...signupMutationOptions(),
    onSuccess: async (result) => {
      queryClient.setQueryData<MeResponse>(authQueryKeys.me, {
        user: result.user,
      })
      void navigate({ to: '/' })
    },
  })

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setErrorMessage(null)

    try {
      await signupMutation.mutateAsync({
        name,
        email,
        password,
      })
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
        <p className="mt-4 rounded bg-rose-100 p-3 text-sm text-rose-900">{errorMessage}</p>
      ) : null}

      <form className="mt-6 flex flex-col gap-3" onSubmit={onSubmit}>
        <label className="text-sm font-medium" htmlFor="name">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded border border-slate-300 px-3 py-2"
          autoComplete="name"
          required
        />

        <label className="text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded border border-slate-300 px-3 py-2"
          autoComplete="email"
          required
        />

        <label className="text-sm font-medium" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded border border-slate-300 px-3 py-2"
          autoComplete="new-password"
          required
        />

        <button
          type="submit"
          disabled={signupMutation.isPending}
          className="mt-2 rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
        >
          {signupMutation.isPending ? 'Creating account...' : 'Sign up with Email'}
        </button>
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
