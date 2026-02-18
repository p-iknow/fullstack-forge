import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/callback/success')({
  component: AuthCallbackSuccessPage,
})

function AuthCallbackSuccessPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-semibold">OAuth callback complete</h1>
      <p className="mt-3 text-center text-sm text-slate-600">
        Your social login was completed. Return to the app to continue.
      </p>
      <a href="/" className="mt-5 rounded bg-slate-900 px-4 py-2 text-white">
        Go to Home
      </a>
    </main>
  )
}
