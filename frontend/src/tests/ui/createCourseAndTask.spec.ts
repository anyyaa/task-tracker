import { test, expect } from '@playwright/test';

test('user can create course and task through UI', async ({ page }) => {
    const email = process.env.VITE_TEST_USER_EMAIL;
    const password = process.env.VITE_TEST_USER_PASSWORD;

    if (!email || !password) {
        throw new Error('Missing test user credentials in .env.test');
    }

    await page.goto('/');

    await page.getByPlaceholder('Email').fill(email);
    await page.locator('input[type="password"]').first().fill(password);
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/courses/);

    await page.getByRole('button', { name: /новый курс|РќРѕРІС‹Р№ РєСѓСЂСЃ/i }).click();

    const courseName = `UI test course ${Date.now()}`;

    await page.locator('input').filter({ hasText: '' }).nth(0);
    await page.getByPlaceholder(/Название курса|РќР°Р·РІР°РЅРёРµ РєСѓСЂСЃР°/).fill(courseName);

    await page
        .getByPlaceholder(/Описание курса|РћРїРёСЃР°РЅРёРµ РєСѓСЂСЃР°/)
        .fill('Course created by Playwright UI test');

    await page.getByRole('button', { name: /создать курс|РЎРѕР·РґР°С‚СЊ РєСѓСЂСЃ/i }).click();

    await expect(page.getByText(courseName)).toBeVisible();

    await page.getByText(courseName).click();

    const taskName = `UI test task ${Date.now()}`;

    await page.getByPlaceholder(/Название задачи|РќР°Р·РІР°РЅРёРµ Р·Р°РґР°С‡Рё/).fill(taskName);
    await page.locator('input[type="datetime-local"]').fill('2026-05-10T12:00');

    await page.getByRole('button', { name: /добавить задачу|Р”РѕР±Р°РІРёС‚СЊ Р·Р°РґР°С‡Сѓ/i }).click();

    await expect(page.getByText(taskName)).toBeVisible();

    await page.locator('.task-checkbox').first().click();

    await expect(page.getByText(taskName)).toBeVisible();
});
