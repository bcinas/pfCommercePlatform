import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'
const JOHN = { email: 'john@test.com', password: '123456' }

async function login(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/login`)
  await page.fill('input[type="email"]', JOHN.email)
  await page.fill('input[type="password"]', JOHN.password)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(BASE + '/')
}

test.describe('Checkout flow', () => {
  test('unauthenticated user sees sign-in message on checkout page with items', async ({ page }) => {
    // Add an item to cart first
    await page.goto(`${BASE}/products`)
    await page.locator('button:has-text("Add to Cart")').first().click()

    // Navigate directly to checkout
    await page.goto(`${BASE}/checkout`)

    // Should see sign-in prompt
    await expect(page.locator('text=/sign in to continue/i')).toBeVisible()
  })

  test('full checkout: login → add product → fill shipping → payment → confirm → redirect', async ({ page }) => {
    await login(page)

    // Add product to cart
    await page.goto(`${BASE}/products`)
    await page.locator('button:has-text("Add to Cart")').first().click()

    // Go to checkout
    await page.goto(`${BASE}/checkout`)

    // Step 1: Shipping
    await page.fill('#fullName', 'John Doe')
    await page.fill('#address', '123 Main Street')
    await page.fill('#city', 'Testville')
    await page.fill('#postalCode', '12345')
    await page.fill('#country', 'US')
    await page.click('button:has-text("Continue to Payment")')

    // Step 2: Payment
    await expect(page.locator('text=/payment details/i')).toBeVisible()
    await page.fill('#cardNumber', '4111111111111111')
    await page.fill('#cardholderName', 'John Doe')
    await page.fill('#expiry', '12/26')
    await page.fill('#cvv', '123')
    await page.click('button:has-text("Pay")')

    // Wait for payment processing (1500ms)
    await page.waitForTimeout(2000)

    // Step 3: Confirm
    await expect(page.locator('text=/review & confirm/i')).toBeVisible()
    await page.click('button:has-text("Confirm & Place Order")')

    // Should redirect to /orders/:id
    await expect(page).toHaveURL(/\/orders\//)
  })
})
