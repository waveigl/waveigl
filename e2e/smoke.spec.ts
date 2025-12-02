import { test, expect } from '@playwright/test'

test('landing page loads and shows WaveIGL CTA', async ({ page }) => {
  await page.goto('/')
  const header = page.locator('header').first()
  await expect(header.getByText('WaveIGL')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Assinar Clube' })).toBeVisible()
})


