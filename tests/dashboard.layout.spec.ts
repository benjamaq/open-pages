import { test, expect } from '@playwright/test';

test.describe('Dashboard layout lock', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dash');
  });

  test('structure + alignment', async ({ page }) => {
    const right = page.locator('[data-testid="dash-grid-right"]');
    await expect(right).toHaveCount(1);

    const expInside = page.locator('[data-testid="dash-grid-right"] >> [data-testid="exp-panel"]');
    const insInside = page.locator('[data-testid="dash-grid-right"] >> [data-testid="insights-panel"]');
    await expect(expInside).toHaveCount(1);
    await expect(insInside).toHaveCount(1);

    const expOutside = page.locator(':not([data-testid="dash-grid-right"]) >> [data-testid="exp-panel"]');
    const insOutside = page.locator(':not([data-testid="dash-grid-right"]) >> [data-testid="insights-panel"]');
    await expect(expOutside).toHaveCount(0);
    await expect(insOutside).toHaveCount(0);

    await page.setViewportSize({ width: 1280, height: 800 });

    const firstCard = page.locator('[data-testid="dash-grid-left"] [data-testid="supplement-card"]').first();
    const expPanel  = expInside.first();

    // Wait for at least one card to be visible
    await expect(firstCard).toBeVisible();
    await expect(expPanel).toBeVisible();

    const leftTop = await firstCard.evaluate(e => e.getBoundingClientRect().top);
    const rightTop = await expPanel.evaluate(e => e.getBoundingClientRect().top);
    expect(Math.abs(leftTop - rightTop)).toBeLessThanOrEqual(2);

    await expect(right).toBeVisible();
    const rightWidth = await right.evaluate(e => e.getBoundingClientRect().width);
    expect(rightWidth).toBeGreaterThan(0);
  });
});


