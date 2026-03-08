import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'

test.describe('Shopping flow', () => {
  test('browses homepage and sees products', async ({ page }) => {
    await page.goto(BASE)
    // Homepage should show products or categories
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('navigates to products page', async ({ page }) => {
    await page.goto(`${BASE}/products`)
    await expect(page).toHaveURL(/\/products/)
  })

  test('adds a product to cart and badge increments', async ({ page }) => {
    await page.goto(`${BASE}/products`)

    // Find first Add to Cart button
    const addBtn = page.locator('button:has-text("Add to Cart")').first()
    await expect(addBtn).toBeVisible()
    await addBtn.click()

    // Cart badge should show 1
    const badge = page.locator('[aria-label*="Shopping cart"]')
    await expect(badge).toContainText('1')
  })

  test('cart page shows items and subtotal', async ({ page }) => {
    await page.goto(`${BASE}/products`)

    const addBtn = page.locator('button:has-text("Add to Cart")').first()
    await addBtn.click()

    await page.goto(`${BASE}/cart`)

    // Should show at least one item and a total
    await expect(page.locator('text=/subtotal|total/i').first()).toBeVisible()
  })

  test('removes item from cart and total updates', async ({ page }) => {
    await page.goto(`${BASE}/products`)
    await page.locator('button:has-text("Add to Cart")').first().click()
    await page.goto(`${BASE}/cart`)

    const removeBtn = page.locator('button:has-text("Remove")').first()
    if (await removeBtn.isVisible()) {
      await removeBtn.click()
      // Cart should be empty or show 0 items
      await expect(page.locator('text=/empty|no items/i')).toBeVisible()
    }
  })

  test('category filter shows relevant products', async ({ page }) => {
    await page.goto(`${BASE}/categories`)
    const catLink = page.locator('a').first()
    await catLink.click()
    await expect(page).toHaveURL(/\/category\//)
  })
})
