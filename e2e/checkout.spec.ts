import { expect, test } from '@playwright/test';

const CUSTOMER = { email: 'tharushi@example.com', password: 'Password123!' };

/** DDP-#35 customer journey: browse → product → cart → checkout (mock gateway) → confirmation. */
test('a customer can buy a product end to end', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(CUSTOMER.email);
  await page.getByLabel('Password').fill(CUSTOMER.password);
  await page.getByRole('button', { name: 'Sign in' }).last().click();
  await expect(page).not.toHaveURL(/\/login/);

  await page.goto('/products');
  await page.locator('a[href^="/products/"]').first().click();
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await expect(page.getByText(/added to your cart/)).toBeVisible();

  await page.goto('/cart');
  await page.getByRole('link', { name: 'Continue to checkout' }).click();
  await expect(page.getByText(/Shipping \(/)).toBeVisible();
  await page.getByRole('button', { name: 'Place order' }).click();

  await expect(page).toHaveURL(/\/checkout\/pay/);
  await page.getByRole('button', { name: 'Pay now' }).click();
  await expect(page).toHaveURL(/\/checkout\/complete/);
  await expect(page.getByRole('heading', { name: 'Thank you for your order!' })).toBeVisible({
    timeout: 30_000,
  });
});

test('an anonymous visitor is sent to sign in before checkout', async ({ page }) => {
  await page.goto('/checkout');
  await expect(page).toHaveURL(/\/login\?next=%2Fcheckout/);
});
