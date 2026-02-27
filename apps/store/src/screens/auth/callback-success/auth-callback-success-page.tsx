import { buttonVariants } from '@fullstack-forge/design-system/components/button'

export function AuthCallbackSuccessPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-semibold">OAuth callback complete</h1>
      <p className="mt-3 text-center text-sm text-slate-600">
        Your social login was completed. Return to the app to continue.
      </p>
      <a href="/" className={`mt-5 ${buttonVariants()}`}>
        Go to Home
      </a>
    </main>
  )
}
