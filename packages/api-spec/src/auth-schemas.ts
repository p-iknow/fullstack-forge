import { z } from 'zod'
import { authRoles, authUserStatuses } from './auth-types'

export const authRoleSchema = z.enum(authRoles)
export const authUserStatusSchema = z.enum(authUserStatuses)

export const authUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: authRoleSchema,
  status: authUserStatusSchema,
})

export const authErrorSchema = z.object({
  code: z.string(),
  error: z.string(),
})
