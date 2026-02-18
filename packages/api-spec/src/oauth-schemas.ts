import { z } from 'zod'
import { oauthProviders } from './oauth-types'

export const oauthProviderSchema = z.enum(oauthProviders)

export const oauthErrorSchema = z.object({
  code: z.string(),
  error: z.string(),
})
