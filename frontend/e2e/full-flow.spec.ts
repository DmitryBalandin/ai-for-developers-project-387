import { expect, test } from '@playwright/test';
import { getFutureDate } from './helpers';

test('complete owner→guest→owner flow', async ({ page }) => {
  // 1. Owner creates an event type
  await page.goto('/owner');
  await page.getByRole('button', { name: 'Создать' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.fill('#et-title', 'full-flow-test');
  await page.fill('#et-desc', 'Сквозной тест');
  await page.fill('#et-dur', '60');
  await page.getByRole('button', { name: 'Создать' }).click();

  await expect(page.getByText('full-flow-test').first()).toBeVisible();
  await expect(page.getByText('Сквозной тест').first()).toBeVisible();

  // 2. Guest navigates to catalog and sees the event type
  await page.goto('/book');
  await expect(page.getByText('full-flow-test').first()).toBeVisible();
  await expect(page.getByText('60 мин').first()).toBeVisible();

  // 3. Guest books a call — click the link inside the specific card
  const catalogCard = page.locator('[data-slot="card"]').filter({ hasText: 'full-flow-test' });
  await catalogCard.getByRole('button', { name: 'Забронировать' }).first().click();
  await expect(page.getByText('full-flow-test').first()).toBeVisible();

  const tomorrow = getFutureDate(1);
  const formattedDate = tomorrow.toLocaleDateString('ru');
  await page.locator(`[data-day="${formattedDate}"]`).click();
  await expect(page.getByText('Доступное время')).toBeVisible();

  const firstSlot = page
    .locator('button')
    .filter({ hasText: /^\d{2}:\d{2}$/ })
    .first();
  await firstSlot.click();

  await page.fill('#name', 'Пётр Сергеев');
  await page.fill('#email', 'petr@example.com');
  await page.click('button:has-text("Подтвердить бронь")');

  await expect(page.getByText('Бронь подтверждена!')).toBeVisible();
  const confirmationText = await page.getByText(/Номер подтверждения:/).textContent();
  expect(confirmationText).toContain('Номер подтверждения:');

  // 4. Owner sees the booking in the dashboard
  await page.goto('/owner');
  await expect(page.getByText('Пётр Сергеев').first()).toBeVisible();
  await expect(page.getByText('petr@example.com').first()).toBeVisible();
  await expect(page.getByText('confirmed').first()).toBeVisible();
});
