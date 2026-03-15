import { createFileRoute } from '@tanstack/react-router'
import { PasswordUpdatePage } from '~/pages/auth/password-update/password-update-page'

export const Route = createFileRoute('/password-update')({
  component: PasswordUpdatePage,
})
