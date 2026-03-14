import { Outlet, createFileRoute } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { StoreTopNav } from '~/screens/catalog/store-top-nav'

export const Route = createFileRoute('/_catalog')({
  component: CatalogLayout,
})

function CatalogLayout() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80">
        <StoreTopNav />
      </div>
      <Outlet />
      <footer className="border-t border-border bg-muted/40 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground md:px-6">
          &copy; 2026 Fullstack Forge Store. All rights reserved.
        </div>
      </footer>
      <Toaster position="top-right" richColors closeButton />
    </div>
  )
}
