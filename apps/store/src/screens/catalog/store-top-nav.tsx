import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Button, buttonVariants } from '@fullstack-forge/design-system/components/button'

import { ShoppingCartIcon } from 'lucide-react'
import { readApiError } from '~/lib/api'
import { authQueryKeys, logoutMutationOptions, meQueryOptions } from '~/lib/queries/auth'
import { cartQueryOptions } from '~/lib/queries/cart'


const MIN_PLACEHOLDER_VISIBLE_MS = 600

export function StoreTopNav() {
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

  const cartQuery = useQuery({
    ...cartQueryOptions(),
    enabled: isHydrated && !!currentUser,
  })
  const cartItemCount = cartQuery.data?.itemCount ?? 0

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
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link
          to="/"
          className="shrink-0 whitespace-nowrap text-sm font-semibold tracking-tight text-slate-900"
        >
          fullstack-forge store
        </Link>

        <div className="flex min-h-8 shrink-0 items-center justify-end gap-2">
          {!showPlaceholder && currentUser ? (
            <Link to="/cart" className="relative mr-1 p-1.5 text-slate-600 hover:text-slate-900">
              <ShoppingCartIcon className="h-5 w-5" aria-hidden="true" />
              {cartItemCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/80 px-1 text-[10px] font-bold text-primary-foreground">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              ) : null}
              <span className="sr-only">장바구니{cartItemCount > 0 ? ` (${cartItemCount}개)` : ''}</span>
            </Link>
          ) : null}
        </div>

        <div className="flex min-h-8 shrink-0 items-center justify-end gap-2">
          {showPlaceholder ? (
            <div
              className="flex animate-pulse items-center justify-end"
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
            <Link to="/login" className={buttonVariants({ size: 'sm' })}>
              Log in
            </Link>
          ) : null}
        </div>
      </nav>

      {errorMessage ? (
        <p className="mx-auto max-w-6xl px-6 pb-2">
          <span className="block rounded bg-rose-100 p-3 text-sm text-rose-900">
            {errorMessage}
          </span>
        </p>
      ) : null}
    </>
  )
}
