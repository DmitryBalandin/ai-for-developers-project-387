import { expect, test } from '@playwright/test';
import { getFutureDate, seedBooking, seedEventType } from './helpers';

test.describe.configure({ mode: 'serial' });

test('shows dashboard page loads correctly', async ({ page }) => {
  await page.goto('/owner');
  await expect(page.getByRole('heading', { name: 'Панель управления' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Типы событий' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Предстоящие брони' })).toBeVisible();
});

test('shows empty state when no event types', async ({ page }) => {
  await page.route('**/api/event-types', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.goto('/owner');
  await expect(page.getByText('Пока нет типов событий. Создайте!')).toBeVisible();
});

test('shows empty bookings state', async ({ page }) => {
  await page.route('**/api/bookings', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.goto('/owner');
  await expect(page.getByText('Нет предстоящих броней.')).toBeVisible();
});

test('creates a new event type', async ({ page }) => {
  await page.goto('/owner');
  await page.getByRole('button', { name: 'Создать' }).click();

  await expect(page.getByRole('dialog')).toBeVisible();

  await page.fill('#et-title', 'owner-create-test');
  await page.fill('#et-desc', 'Созданный тип');
  await page.fill('#et-dur', '30');
  await page.getByRole('button', { name: 'Создать' }).click();

  await expect(page.getByText('owner-create-test').first()).toBeVisible();
  await expect(page.getByText('Созданный тип').first()).toBeVisible();
});

test('edits an event type through the UI', async ({ page }) => {
  const et = await seedEventType({
    title: 'owner-edit-before',
    description: 'До редактирования',
    durationMinutes: 30,
  });

  await page.goto('/owner');
  await expect(page.getByText(et.title).first()).toBeVisible();

  const cardContent = page.locator('[data-slot="card-content"]').filter({ hasText: et.title });
  await cardContent.locator('button').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.fill('#et-title', 'owner-edit-after');
  await page.fill('#et-desc', 'После редактирования');
  await page.fill('#et-dur', '60');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(page.getByText('owner-edit-after').first()).toBeVisible();
  await expect(page.getByText('После редактирования').first()).toBeVisible();
  await expect(page.getByText('60 мин').first()).toBeVisible();
});

test('deletes an event type through the UI', async ({ page }) => {
  const et = await seedEventType({
    title: 'owner-delete-ui',
    description: 'Будет удалён',
    durationMinutes: 30,
  });

  await page.goto('/owner');
  await expect(page.getByText(et.title).first()).toBeVisible();

  const card = page.locator('[data-slot="card"]').filter({ hasText: et.title });
  await card.locator('button').nth(1).click();

  await expect(page.getByText(et.title).first()).not.toBeVisible();
});

test('shows upcoming bookings', async ({ page }) => {
  const et = await seedEventType({
    title: 'owner-bookings-test',
    description: 'Для брони',
    durationMinutes: 30,
  });
  const startTime = getFutureDate(1);
  startTime.setHours(10, 0, 0, 0);

  const booking = await seedBooking(et.id, {
    guestName: 'Мария Иванова',
    guestEmail: 'maria@example.com',
    startTime: startTime.toISOString(),
  });

  await page.goto('/owner');

  await expect(page.getByText(booking.guestName).first()).toBeVisible();
  await expect(page.getByText(booking.guestEmail!).first()).toBeVisible();
  await expect(page.getByText(booking.status).first()).toBeVisible();
});
