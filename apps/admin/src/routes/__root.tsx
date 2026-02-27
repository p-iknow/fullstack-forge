import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { Outlet, createRootRoute, HeadContent, Scripts, Link } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { QueryClient } from '@tanstack/react-query'
import appCss from '~/styles/app.css?url'

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
      </nav>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  )
}

function NotFoundComponent() {
  return <p className="p-6 text-sm text-slate-600">Page not found.</p>
}
