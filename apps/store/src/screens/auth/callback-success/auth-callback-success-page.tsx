import { buttonVariants } from '@fullstack-forge/design-system/components/button'

export function AuthCallbackSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">소셜 로그인 완료</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          소셜 로그인이 완료되었습니다. 홈으로 이동하여 계속 이용하세요.
        </p>
        <a href="/" className={`mt-6 inline-flex ${buttonVariants()}`}>
          홈으로 이동
        </a>
      </div>
    </main>
  )
}
