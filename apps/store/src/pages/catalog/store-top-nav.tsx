import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Button, buttonVariants } from '@fullstack-forge/design-system/components/button'

import { ShoppingCartIcon, UserIcon } from 'lucide-react'
import { readApiError } from '~/@shared/api'
import { authQueryKeys, logoutMutationOptions, meQueryOptions } from '~/@shared/queries/auth'
import { cartQueryOptions } from '~/@shared/queries/cart'


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
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
        <Link
          to="/"
          className="shrink-0 whitespace-nowrap text-base font-bold tracking-tight text-foreground"
        >
          FORGE STORE
        </Link>

        <div className="flex shrink-0 items-center gap-1">
          {!showPlaceholder && currentUser ? (
            <Link
              to="/cart"
              className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ShoppingCartIcon className="h-5 w-5" aria-hidden="true" />
              {cartItemCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              ) : null}
              <span className="sr-only">장바구니{cartItemCount > 0 ? ` (${cartItemCount}개)` : ''}</span>
            </Link>
          ) : null}

          {showPlaceholder ? (
            <div
              className="flex animate-pulse items-center gap-2"
              role="status"
              aria-label="Checking session"
            >
              <div className="h-8 w-8 rounded-lg bg-muted" aria-hidden />
              <div className="h-8 w-16 rounded-lg bg-muted" aria-hidden />
            </div>
          ) : null}

          {!showPlaceholder && currentUser ? (
            <>
              <span className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground">
                <UserIcon className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">로그인됨</span>
              </span>
              <Button
                type="button"
                onClick={() => {
                  void onLogout()
                }}
                disabled={logoutMutation.isPending}
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
              >
                로그아웃
              </Button>
            </>
          ) : null}

          {!showPlaceholder && !currentUser ? (
            <Link to="/login" className={buttonVariants({ size: 'sm' })}>
              로그인
            </Link>
          ) : null}
        </div>
      </nav>

      {errorMessage ? (
        <p className="mx-auto max-w-7xl px-4 pb-2 md:px-6">
          <span className="block rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {errorMessage}
          </span>
        </p>
      ) : null}
    </>
  )
}
