import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { readApiError } from '~/lib/api'
import {
  authQueryKeys,
  logoutMutationOptions,
  meQueryOptions,
  resolveMeInitialDataFromAuthHint,
} from '~/lib/queries/auth'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const queryClient = useQueryClient()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const meInitialData = resolveMeInitialDataFromAuthHint()
  const isServerRender = typeof document === 'undefined'
  const shouldCheckSession = meInitialData !== null
  const meQuery = useQuery({
    ...meQueryOptions(meInitialData),
    enabled: !isServerRender && shouldCheckSession,
  })

  const logoutMutation = useMutation({
    ...logoutMutationOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.me })
    },
  })

  const onLogout = async (): Promise<void> => {
    try {
      await logoutMutation.mutateAsync()
    } catch (error) {
      const parsed = await readApiError(error)
      if (parsed.error) {
        setErrorMessage(parsed.code ? `${parsed.error} (${parsed.code})` : parsed.error)
      } else {
        setErrorMessage('Failed to log out. Please try again.')
      }
    }
  }

  const isCheckingSession = isServerRender || (shouldCheckSession && meQuery.isPending)
  const currentUser = meQuery.data?.user ?? null
  const userInitial = currentUser?.name?.trim().charAt(0).toUpperCase() ?? 'U'

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-14">
        <nav className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
          <a href="/" className="text-sm font-semibold tracking-tight text-slate-900">
            fullstack-forge store
          </a>
          <div className="flex min-h-9 min-w-70 items-center justify-end gap-2">
            {isCheckingSession ? (
              <div className="flex w-full max-w-70 items-center justify-end gap-2 animate-pulse">
                <div className="h-8 w-33 rounded bg-slate-200" />
                <div className="h-8 w-24 rounded bg-slate-200" />
              </div>
            ) : null}

            {!isCheckingSession && currentUser ? (
              <>
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
                    {userInitial}
                  </div>
                  <div className="max-w-37.5 leading-tight">
                    <p className="truncate text-[11px] font-medium text-slate-800">
                      {currentUser.name}
                    </p>
                    <p className="truncate text-[10px] text-slate-500">{currentUser.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void onLogout()
                  }}
                  disabled={logoutMutation.isPending}
                  className="rounded bg-slate-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
                >
                  {logoutMutation.isPending ? 'Signing out...' : 'Log out'}
                </button>
              </>
            ) : null}

            {!isCheckingSession && !currentUser ? (
              <>
                <a
                  href="/login"
                  className="rounded bg-slate-900 px-3 py-2 text-xs font-medium text-white"
                >
                  Log in
                </a>
                <a
                  href="/signup"
                  className="rounded border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900"
                >
                  Sign up
                </a>
              </>
            ) : null}
          </div>
        </nav>

        <header className="space-y-4">
          <p className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
            commerce demo
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Quick commerce, built for speed.
          </h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Browse essentials, place orders in seconds, and keep delivery updates in one place.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium">Fast checkout</p>
            <p className="mt-1 text-xs text-slate-600">
              Email or social login with one unified session policy.
            </p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium">Reliable delivery flow</p>
            <p className="mt-1 text-xs text-slate-600">
              Order, payment, and status transitions are tracked end-to-end.
            </p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium">Auth security baseline</p>
            <p className="mt-1 text-xs text-slate-600">
              Rate limiting, rotation, and audit events wired by default.
            </p>
          </article>
        </div>
        {errorMessage ? (
          <p className="rounded bg-rose-100 p-3 text-sm text-rose-900">{errorMessage}</p>
        ) : null}
      </section>
    </main>
  )
}
