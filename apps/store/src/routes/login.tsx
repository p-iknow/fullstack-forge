import { createFileRoute } from '@tanstack/react-router'
import { LoginPage } from '~/screens/auth/login/login-page'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})
