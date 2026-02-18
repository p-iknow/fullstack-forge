import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { readApiError } from '~/lib/api'
import { authQueryKeys, loginMutationOptions } from '~/lib/queries/auth'
import type { MeResponse } from '~/lib/queries/auth'

const googleStartUrl = '/api/auth/oauth/google/start?redirect=/auth/callback/success'
const kakaoStartUrl = '/api/auth/oauth/kakao/start?redirect=/auth/callback/success'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [email, setEmail] = useState('customer@fullstack-forge.local')
  const [password, setPassword] = useState('Passw0rd!')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loginMutation = useMutation({
    ...loginMutationOptions(),
    onSuccess: async (result) => {
      queryClient.setQueryData<MeResponse>(authQueryKeys.me, {
        user: result.user,
      })
      void navigate({ to: '/' })
      setErrorMessage(`Signed in as ${result.user.email}`)
    },
  })

  const bannerMessage = useMemo(() => null, [])

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setErrorMessage(null)

    try {
      await loginMutation.mutateAsync({ email, password })
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
      <h1 className="text-3xl font-semibold">Sign in</h1>
      <p className="mt-2 text-sm text-slate-600">Use Email, Google, or Kakao to continue.</p>

      {bannerMessage ? (
        <p className="mt-4 rounded bg-amber-100 p-3 text-sm text-amber-900">{bannerMessage}</p>
      ) : null}
      {errorMessage ? (
        <p className="mt-4 rounded bg-rose-100 p-3 text-sm text-rose-900">{errorMessage}</p>
      ) : null}
      {loginMutation.isSuccess ? (
        <p className="mt-4 rounded bg-emerald-100 p-3 text-sm text-emerald-900">Signed in.</p>
      ) : null}

      <form className="mt-6 flex flex-col gap-3" onSubmit={onSubmit}>
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
          autoComplete="current-password"
          required
        />

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="mt-2 rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
        >
          {loginMutation.isPending ? 'Signing in...' : 'Sign in with Email'}
        </button>
      </form>

      <div className="mt-6 grid gap-2">
        <a className="rounded border border-slate-300 px-4 py-2 text-center" href={googleStartUrl}>
          Continue with Google
        </a>
        <a className="rounded border border-slate-300 px-4 py-2 text-center" href={kakaoStartUrl}>
          Continue with Kakao
        </a>
      </div>

      <p className="mt-6 text-sm text-slate-600">
        New here?{' '}
        <Link to="/signup" className="underline">
          Create account
        </Link>
      </p>
      <p className="mt-2 text-sm text-slate-600">
        Have a reset token?{' '}
        <Link to="/password-update" className="underline">
          Update password
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
