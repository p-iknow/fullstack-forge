import type { ReactNode } from 'react'
import { QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
  Link,
  Navigate,
  useRouterState,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { QueryClient } from '@tanstack/react-query'
import { OverlayProvider } from 'overlay-kit'
import appCss from '~/styles/app.css?url'
import { meQueryOptions, logoutMutationOptions, authQueryKeys } from '~/@shared/queries/auth'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
    },
  },
})

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Admin' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <AuthGate />
    </RootDocument>
  )
}

function AuthGate() {
  const location = useRouterState({ select: (s) => s.location })
  const isLoginPage = location.pathname === '/login'
  const { data: me, isLoading } = useQuery(meQueryOptions())

  if (isLoading) {
    return <p className="p-6 text-sm text-slate-500">Loading...</p>
  }

  if (!me && !isLoginPage) {
    return <Navigate to="/login" />
  }

  if (me && isLoginPage) {
    return <Navigate to="/" />
  }

  if (isLoginPage) {
    return <Outlet />
  }

  return (
    <>
      <AdminNav userEmail={me?.user.email} />
      <Outlet />
    </>
  )
}

function AdminNav({ userEmail }: { userEmail?: string }) {
  const queryClient = useQueryClient()
  const logoutMutation = useMutation({
    ...logoutMutationOptions(),
    onSuccess: () => {
      queryClient.setQueryData(authQueryKeys.me, null)
    },
  })

  return (
    <nav className="flex flex-row items-center gap-4 border-b border-slate-200 bg-white px-6 py-3">
      <Link
        to="/"
        className="text-sm font-medium text-slate-600 hover:text-slate-900"
        activeProps={{ className: 'text-slate-900 font-semibold' }}
        activeOptions={{ exact: true }}
      >
        상품 관리
      </Link>
      <Link
        to="/categories"
        className="text-sm font-medium text-slate-600 hover:text-slate-900"
        activeProps={{ className: 'text-slate-900 font-semibold' }}
      >
        카테고리 관리
      </Link>
      <div className="ml-auto flex items-center gap-3">
        {userEmail ? <span className="text-xs text-slate-500">{userEmail}</span> : null}
        <button
          type="button"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="text-xs text-slate-500 hover:text-slate-900"
        >
          로그아웃
        </button>
      </div>
    </nav>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        <OverlayProvider>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </OverlayProvider>
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  )
}

function NotFoundComponent() {
  return <p className="p-6 text-sm text-slate-600">Page not found.</p>
}
