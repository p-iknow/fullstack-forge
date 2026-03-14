import { Outlet, createFileRoute } from '@tanstack/react-router'
import { StoreTopNav } from '~/screens/catalog/store-top-nav'

export const Route = createFileRoute('/_catalog')({
  component: CatalogLayout,
})

function CatalogLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <StoreTopNav />
      </div>
      <Outlet />
    </div>
  )
}
