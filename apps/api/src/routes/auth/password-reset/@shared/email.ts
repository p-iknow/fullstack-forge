type SendPasswordResetEmailInput = {
  toEmail: string
  token: string
}

const DEFAULT_STORE_ORIGIN = 'http://localhost:3000'

function resolveStoreOrigin(): string {
  return process.env.STORE_ORIGIN?.trim() || process.env.FRONTEND_ORIGIN?.trim() || DEFAULT_STORE_ORIGIN
}

function resolvePasswordResetLink(token: string): string {
  const base = resolveStoreOrigin()
  const url = new URL('/password-update', base)
  url.searchParams.set('token', token)
  return url.toString()
}

export async function sendPasswordResetEmail(input: SendPasswordResetEmailInput): Promise<void> {
  const resetLink = resolvePasswordResetLink(input.token)
  const resendApiKey = process.env.RESEND_API_KEY?.trim()
  const mailFrom = process.env.AUTH_MAIL_FROM?.trim()

  if (!resendApiKey || !mailFrom) {
    console.info('[auth] password reset mail fallback', {
      to: input.toEmail,
      resetLink,
    })
    return
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: mailFrom,
      to: [input.toEmail],
      subject: 'Reset your password',
      text: `Use this link to reset your password: ${resetLink}`,
    }),
  })

  if (!response.ok) {
    throw new Error('password reset email delivery failed')
  }
}
