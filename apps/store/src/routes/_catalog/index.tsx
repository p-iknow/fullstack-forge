import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '~/screens/home/home-page'

export const Route = createFileRoute('/_catalog/')({
  component: HomePage,
})
