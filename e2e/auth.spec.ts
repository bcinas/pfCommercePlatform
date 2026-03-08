import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'

// Seeded accounts from seed.ts
const ADMIN = { email: 'admin@test.com', password: '123456' }
const JOHN = { email: 'john@test.com', password: '123456' }

test.describe('Authentication flows', () => {
  test('registers a new account', async ({ page }) => {
    const unique = Date.now()
    await page.goto(`${BASE}/register`)

    await page.fill('input[type="text"]', `New User ${unique}`)
    await page.fill('input[type="email"]', `newuser${unique}@test.com`)
    await page.fill('input[type="password"]', 'newpassword123')
    await page.click('button[type="submit"]')

    // Should redirect away from register page after success
    await expect(page).not.toHaveURL(/\/register/)
  })

  test('logs in as john@test.com', async ({ page }) => {
    await page.goto(`${BASE}/login`)

    await page.fill('input[type="email"]', JOHN.email)
    await page.fill('input[type="password"]', JOHN.password)
    await page.click('button[type="submit"]')

    // Should redirect to home
    await expect(page).toHaveURL(BASE + '/')
  })

  test('shows error for wrong password', async ({ page }) => {
    await page.goto(`${BASE}/login`)

    await page.fill('input[type="email"]', JOHN.email)
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=Invalid credentials')).toBeVisible()
  })

  test('admin login shows Admin link in header', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.fill('input[type="email"]', ADMIN.email)
    await page.fill('input[type="password"]', ADMIN.password)
    await page.click('button[type="submit"]')

    await expect(page.locator('a[href="/admin"]')).toBeVisible()
  })

  test('logout clears the session', async ({ page }) => {
    // Login first
    await page.goto(`${BASE}/login`)
    await page.fill('input[type="email"]', JOHN.email)
    await page.fill('input[type="password"]', JOHN.password)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(BASE + '/')

    // Logout
    await page.click('button:has-text("Logout")')

    // Should show Login link
    await expect(page.locator('a[href="/login"]').first()).toBeVisible()
  })
})
