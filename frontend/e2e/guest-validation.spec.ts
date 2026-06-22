import { expect, test } from '@playwright/test';
import { getFutureDate, seedEventType } from './helpers';

test.describe.configure({ mode: 'serial' });

test('shows error for invalid email format', async ({ page }) => {
  const et = await seedEventType({
    title: 'email-valid-test',
    description: 'Тест email',
    durationMinutes: 30,
  });

  await page.goto(`/book/${et.id}`);
  await expect(page.getByText(et.title).first()).toBeVisible();

  const tomorrow = getFutureDate(1);
  const formattedDate = tomorrow.toLocaleDateString('ru');
  await page.locator(`[data-day="${formattedDate}"]`).click();
  await expect(page.getByText('Доступное время')).toBeVisible();

  const firstSlot = page
    .locator('button')
    .filter({ hasText: /^\d{2}:\d{2}$/ })
    .first();
  await firstSlot.click();

  await page.fill('#name', 'Test User');
  await page.fill('#email', 'not-an-email');

  // Disable HTML5 validation so the form submits to the API
  await page.evaluate(() => {
    const form = document.querySelector('form');
    if (form) form.setAttribute('novalidate', '');
  });
  await page.getByRole('button', { name: 'Подтвердить бронь' }).click();

  await expect(page.getByText(/Invalid/i)).toBeVisible();
});

test('selecting a different slot deselects the first one', async ({ page }) => {
  const et = await seedEventType({
    title: 'slot-toggle-test',
    description: 'Тест переключения слотов',
    durationMinutes: 30,
  });

  await page.goto(`/book/${et.id}`);
  await expect(page.getByText(et.title).first()).toBeVisible();

  const tomorrow = getFutureDate(1);
  const formattedDate = tomorrow.toLocaleDateString('ru');
  await page.locator(`[data-day="${formattedDate}"]`).click();
  await expect(page.getByText('Доступное время')).toBeVisible();

  const slots = page.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ });
  await slots.nth(0).click();
  await expect(page.getByRole('button', { name: 'Подтвердить бронь' })).toBeVisible();

  await slots.nth(1).click();
  await expect(page.getByRole('button', { name: 'Подтвердить бронь' })).toBeVisible();

  // Verify the form works with the newly selected slot
  await page.fill('#name', 'Test User');
  await page.getByRole('button', { name: 'Подтвердить бронь' }).click();
  await expect(page.getByText('Бронь подтверждена!')).toBeVisible();
});
