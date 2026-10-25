import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGES = ['/', '/products', '/bundles', '/login'];

/** DDP-#35/#36 — no serious or critical WCAG 2.1 AA violations on the main screens. */
for (const path of PAGES) {
  test(`no serious accessibility violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(blocking.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
}

test('the Sinhala locale renders with lang="si"', async ({ page, context }) => {
  await context.addCookies([{ name: 'NEXT_LOCALE', value: 'si', url: 'http://localhost:3000' }]);
  await page.goto('/products');
  await expect(page.locator('html')).toHaveAttribute('lang', 'si');
});
