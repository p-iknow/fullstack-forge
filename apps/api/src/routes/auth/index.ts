import { createRouter } from '~/lib/create-app'
import {
  loginRoute,
  logoutRoute,
  meRoute,
  oauthCallbackRoute,
  oauthStartRoute,
  refreshRoute,
  signupRoute,
} from '@fullstack-forge/api-spec/routes/auth'
import { loginHandler } from './login/handler'
import { logoutHandler } from './logout/handler'
import { meHandler } from './me/handler'
import { refreshHandler } from './refresh/handler'
import { signupHandler } from './signup/handler'
import { oauthCallbackHandler } from './oauth/callback/handler'
import { oauthStartHandler } from './oauth/start/handler'

export const authIndex = createRouter()

authIndex.openapi(signupRoute, signupHandler)
authIndex.openapi(loginRoute, loginHandler)
authIndex.openapi(refreshRoute, refreshHandler)
authIndex.openapi(logoutRoute, logoutHandler)
authIndex.openapi(meRoute, meHandler)
authIndex.openapi(oauthStartRoute, oauthStartHandler)
authIndex.openapi(oauthCallbackRoute, oauthCallbackHandler)
