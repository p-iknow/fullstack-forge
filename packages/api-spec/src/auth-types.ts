export const authRoles = ['customer', 'operator', 'admin'] as const
export const authUserStatuses = ['active', 'locked', 'withdrawn'] as const

export type AuthRole = (typeof authRoles)[number]
export type AuthUserStatus = (typeof authUserStatuses)[number]

export type AuthUser = {
  id: string
  email: string
  name: string
  role: AuthRole
  status: AuthUserStatus
}

export type AuthError = {
  code: string
  error: string
}
