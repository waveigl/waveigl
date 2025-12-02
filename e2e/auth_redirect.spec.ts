import { test, expect } from '@playwright/test'

test('redirects anonymous user from /dashboard to /auth/login', async ({ page }) => {
  const resp = await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/auth\/login/)
})


