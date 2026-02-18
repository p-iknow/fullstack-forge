import { createFileRoute } from '@tanstack/react-router'
import { AuthCallbackSuccessPage } from '~/screens/auth/callback-success/auth-callback-success-page'

export const Route = createFileRoute('/auth/callback/success')({
  component: AuthCallbackSuccessPage,
})
