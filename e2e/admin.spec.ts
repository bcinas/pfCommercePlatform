import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'
const ADMIN = { email: 'admin@test.com', password: '123456' }
const JOHN = { email: 'john@test.com', password: '123456' }

async function loginAs(page: import('@playwright/test').Page, user: { email: string; password: string }) {
  await page.goto(`${BASE}/login`)
  await page.fill('input[type="email"]', user.email)
  await page.fill('input[type="password"]', user.password)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(BASE + '/')
}

test.describe('Admin dashboard', () => {
  test('non-admin (john) is redirected away from /admin', async ({ page }) => {
    await loginAs(page, JOHN)
    await page.goto(`${BASE}/admin`)

    // Should redirect to /login or show unauthorized
    await expect(page).not.toHaveURL(`${BASE}/admin`)
  })

  test('admin sees dashboard with stats', async ({ page }) => {
    await loginAs(page, ADMIN)
    await page.goto(`${BASE}/admin`)

    // Dashboard should show stats (revenue, orders, customers)
    await expect(page.locator('text=/total|revenue|orders/i').first()).toBeVisible()
  })

  test('admin views orders list', async ({ page }) => {
    await loginAs(page, ADMIN)
    await page.goto(`${BASE}/admin/orders`)

    await expect(page.locator('table, [data-testid="orders-table"], text=/order/i').first()).toBeVisible()
  })

  test('admin views products list', async ({ page }) => {
    await loginAs(page, ADMIN)
    await page.goto(`${BASE}/admin/products`)

    await expect(page.locator('table, [data-testid="products-table"], text=/product/i').first()).toBeVisible()
  })
})
