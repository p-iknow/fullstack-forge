import { expect, test } from '@playwright/test'

test.describe('OAuth login flow', () => {
  test('shows login page with OAuth buttons', async ({ page }) => {
    // given
    await page.goto('/login')

    // when
    const googleOAuthLink = page.getByRole('link', { name: 'Continue with Google' })
    const kakaoOAuthLink = page.getByRole('link', { name: 'Continue with Kakao' })

    // then
    await expect(googleOAuthLink).toBeVisible()
    await expect(kakaoOAuthLink).toBeVisible()
  })

  test('OAuth links point to correct start URLs', async ({ page }) => {
    // given
    await page.goto('/login')

    // when
    const googleOAuthLink = page.getByRole('link', { name: 'Continue with Google' })
    const kakaoOAuthLink = page.getByRole('link', { name: 'Continue with Kakao' })

    // then
    await expect(googleOAuthLink).toHaveAttribute(
      'href',
      '/api/auth/oauth/google/start?redirect=/auth/callback/success',
    )
    await expect(kakaoOAuthLink).toHaveAttribute(
      'href',
      '/api/auth/oauth/kakao/start?redirect=/auth/callback/success',
    )
  })

  test('completes Google OAuth flow via route interception', async ({ page }) => {
    // given
    // Intercept the start endpoint BEFORE navigating so the route is registered early.
    // Use regex because Playwright glob '*' does not match '?' in query strings.
    // In production: start → external provider → callback → success.
    // In test: start → success (skipping external provider and callback).
    await page.route(/\/api\/auth\/oauth\/google\/start/, async (route) => {
      const url = new URL(route.request().url())
      const redirect = url.searchParams.get('redirect') ?? '/auth/callback/success'
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `<html><head><meta http-equiv="refresh" content="0;url=${redirect}"></head></html>`,
      })
    })
    await page.goto('/login')

    // when
    await page.getByRole('link', { name: 'Continue with Google' }).click()

    // then
    await expect(page).toHaveURL(/\/auth\/callback\/success/)
    await expect(page.getByRole('heading', { name: 'OAuth callback complete' })).toBeVisible()
  })

  test('completes Kakao OAuth flow via route interception', async ({ page }) => {
    // given
    await page.route(/\/api\/auth\/oauth\/kakao\/start/, async (route) => {
      const url = new URL(route.request().url())
      const redirect = url.searchParams.get('redirect') ?? '/auth/callback/success'
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `<html><head><meta http-equiv="refresh" content="0;url=${redirect}"></head></html>`,
      })
    })
    await page.goto('/login')

    // when
    await page.getByRole('link', { name: 'Continue with Kakao' }).click()

    // then
    await expect(page).toHaveURL(/\/auth\/callback\/success/)
    await expect(page.getByRole('heading', { name: 'OAuth callback complete' })).toBeVisible()
  })
})
