import type { ReactNode } from 'react'
import type { RenderOptions } from '@testing-library/react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'

type RenderWithRouterOptions = {
  initialLocation?: string
  renderOptions?: Omit<RenderOptions, 'wrapper'>
}

/**
 * Render a component inside a real TanStack Router context.
 *
 * Creates a minimal router with a root route (Outlet) and a catch-all child
 * route that renders the given component at `initialLocation`.
 *
 * This replaces `vi.mock('@tanstack/react-router')` — components get real
 * `<Link>`, `useNavigate`, `useParams`, etc., so tests exercise actual routing.
 */
export async function renderWithRouter(ui: ReactNode, options: RenderWithRouterOptions = {}) {
  const { initialLocation = '/', renderOptions } = options

  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  })

  const catchAllRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '$',
    component: () => <>{ui}</>,
  })

  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <>{ui}</>,
  })

  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, catchAllRoute]),
    history: createMemoryHistory({ initialEntries: [initialLocation] }),
  })

  await router.load()

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  const result = render(<RouterProvider router={router} />, {
    ...renderOptions,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  })

  return { ...result, router, queryClient }
}
