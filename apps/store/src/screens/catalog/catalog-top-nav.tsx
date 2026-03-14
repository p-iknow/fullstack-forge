import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, buttonVariants } from '@fullstack-forge/design-system/components/button'
import { readApiError } from '~/lib/api'
import { authQueryKeys, logoutMutationOptions, meQueryOptions } from '~/lib/queries/auth'

const MIN_PLACEHOLDER_VISIBLE_MS = 600

export function CatalogTopNav() {
  const queryClient = useQueryClient()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [keepPlaceholderVisible, setKeepPlaceholderVisible] = useState(false)
  const placeholderShownAtRef = useRef<number | null>(null)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const meQuery = useQuery({
    ...meQueryOptions(),
    enabled: isHydrated,
  })

  const logoutMutation = useMutation({
    ...logoutMutationOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.me })
    },
  })

  const onLogout = async (): Promise<void> => {
    try {
      setErrorMessage(null)
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

  const currentUser = meQuery.data?.user ?? null
  const isCheckingSession = !isHydrated || (meQuery.isPending && !meQuery.isFetched && !currentUser)

  useEffect(() => {
    if (isCheckingSession) {
      if (!keepPlaceholderVisible) {
        setKeepPlaceholderVisible(true)
      }
      if (placeholderShownAtRef.current === null) {
        placeholderShownAtRef.current = Date.now()
      }
      return
    }

    if (!keepPlaceholderVisible) {
      placeholderShownAtRef.current = null
      return
    }

    const shownAt = placeholderShownAtRef.current
    if (shownAt === null) {
      setKeepPlaceholderVisible(false)
      return
    }

    const elapsedMs = Date.now() - shownAt
    const remainingMs = Math.max(0, MIN_PLACEHOLDER_VISIBLE_MS - elapsedMs)
    const timer = window.setTimeout(() => {
      setKeepPlaceholderVisible(false)
      placeholderShownAtRef.current = null
    }, remainingMs)

    return () => {
      window.clearTimeout(timer)
    }
  }, [isCheckingSession, keepPlaceholderVisible])

  const showPlaceholder = isCheckingSession || keepPlaceholderVisible

  return (
    <>
      <nav className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <a
          href="/"
          className="whitespace-nowrap text-sm font-semibold tracking-tight text-slate-900"
        >
          fullstack-forge store
        </a>
        <div className="flex min-h-8 shrink-0 items-center justify-end gap-2">
          {showPlaceholder ? (
            <div
              className="flex items-center justify-end animate-pulse"
              role="status"
              aria-label="Checking session"
            >
              <div
                className={`${buttonVariants({ size: 'sm' })} pointer-events-none !bg-slate-200 !text-slate-200 hover:!bg-slate-200`}
                aria-hidden
              >
                Log out
              </div>
            </div>
          ) : null}

          {!showPlaceholder && currentUser ? (
            <Button
              type="button"
              onClick={() => {
                void onLogout()
              }}
              disabled={logoutMutation.isPending}
              size="sm"
            >
              Log out
            </Button>
          ) : null}

          {!showPlaceholder && !currentUser ? (
            <a href="/login" className={buttonVariants({ size: 'sm' })}>
              Log in
            </a>
          ) : null}
        </div>
      </nav>

      {errorMessage ? (
        <p className="rounded bg-rose-100 p-3 text-sm text-rose-900">{errorMessage}</p>
      ) : null}
    </>
  )
}
