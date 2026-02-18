import { createFileRoute } from '@tanstack/react-router'
import { PasswordUpdatePage } from '~/screens/auth/password-update/password-update-page'

export const Route = createFileRoute('/password-update')({
  component: PasswordUpdatePage,
})
