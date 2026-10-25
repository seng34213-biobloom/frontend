import { expect, test } from '@playwright/test';

const ADMIN = { email: 'admin@biobloom.lk', password: 'Password123!' };

test('an anonymous visitor is redirected to sign in', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
});

/** DDP-#31 / #35 admin journey: sign in, dashboard, add a batch, see it listed. */
test('an admin signs in, views the dashboard and adds a batch', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(ADMIN.email);
  await page.getByLabel('Password').fill(ADMIN.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText(/revenue/i).first()).toBeVisible();

  await page.goto('/products');
  await page.getByRole('link', { name: 'Batches' }).first().click();
  const batchNumber = `E2E-${Date.now()}`;
  await page.getByLabel('Batch number').fill(batchNumber);
  const expiry = new Date(Date.now() + 90 * 86_400_000).toISOString().slice(0, 10);
  await page.getByLabel('Expiry').fill(expiry);
  await page.getByLabel('Quantity').fill('12');
  await page.getByRole('button', { name: 'Add batch' }).click();
  await expect(page.getByRole('cell', { name: batchNumber })).toBeVisible();
});

test('a past expiry date shows the API error beside the form', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(ADMIN.email);
  await page.getByLabel('Password').fill(ADMIN.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.goto('/products');
  await page.getByRole('link', { name: 'Batches' }).first().click();
  await page.getByLabel('Batch number').fill(`E2E-PAST-${Date.now()}`);
  await page.getByLabel('Expiry').fill('2020-01-01');
  await page.getByLabel('Quantity').fill('1');
  await page.getByRole('button', { name: 'Add batch' }).click();
  await expect(page.getByRole('alert')).toContainText(/expiry/i);
});
