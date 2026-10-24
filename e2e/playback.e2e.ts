import { expect, test } from '@playwright/test';

import { EditorPage, SQUARE } from './pages/editor-page';

test.describe('режимы показа', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.openClean();
    await editor.drawShape(SQUARE);
    // убираем фокус с кнопок: горячие клавиши проверяем как у пользователя после клика по сцене
    await editor.clickStage({ x: 1100, y: 650 });
  });

  test('в редакторе проектор показывает тонкие контуры', async () => {
    await expect.poll(() => editor.getLitPixelRatio()).toBeGreaterThan(0);
  });

  test('в редакторе горит меньше, чем в показе', async ({ page }) => {
    await page.keyboard.press('Space');
    await expect(editor.button('Редактор (Space)')).toBeVisible();
    const showRatio = await editor.getLitPixelRatio();

    await page.keyboard.press('Space');
    await expect(editor.button('Показ (Space)')).toBeVisible();

    expect(await editor.getLitPixelRatio()).toBeLessThan(showRatio);
  });

  test('переключает показ клавишей Space', async ({ page }) => {
    await page.keyboard.press('Space');

    await expect(editor.button('Редактор (Space)')).toBeVisible();
  });

  test('переключает показ кнопкой', async () => {
    await editor.button('Показ (Space)').click();

    await expect(editor.button('Редактор (Space)')).toBeVisible();
  });

  test('в показе фигура светится эффектом', async () => {
    await editor.button('Показ (Space)').click();

    await expect.poll(() => editor.getLitPixelRatio()).toBeGreaterThan(0.02);
  });

  test('Blackout гасит сцену', async ({ page }) => {
    await editor.button('Показ (Space)').click();

    await page.keyboard.press('b');

    await expect.poll(() => editor.getLitPixelRatio()).toBe(0);
  });

  test('повторный Blackout возвращает картинку', async ({ page }) => {
    await editor.button('Показ (Space)').click();
    await page.keyboard.press('b');
    await expect.poll(() => editor.getLitPixelRatio()).toBe(0);

    await page.keyboard.press('b');

    await expect.poll(() => editor.getLitPixelRatio()).toBeGreaterThan(0.02);
  });

  test('горячие клавиши работают сразу после клика по кнопке', async ({ page }) => {
    await editor.button('Показ (Space)').click();

    await page.keyboard.press('b');

    await expect.poll(() => editor.getLitPixelRatio()).toBe(0);
  });

  test('авто-режим включает показ', async ({ page }) => {
    await page.keyboard.press('a');

    await expect(editor.button('Редактор (Space)')).toBeVisible();
  });

  test('в авто-режиме картинка меняется со временем', async ({ page }) => {
    await page.keyboard.press('a');
    await expect.poll(() => editor.getLitPixelRatio()).toBeGreaterThan(0.01);
    const first = (await editor.stage.screenshot()).toString('base64');

    await page.waitForTimeout(600);

    expect((await editor.stage.screenshot()).toString('base64')).not.toBe(first);
  });

  test('горячие клавиши не срабатывают при вводе названия', async ({ page }) => {
    await editor.clickStage({ x: 400, y: 300 });
    await page.getByRole('textbox', { name: 'Название' }).click();

    await page.keyboard.type('b a');

    await expect(page.getByRole('textbox', { name: 'Название' })).toHaveValue('Фигура 1b a');
  });

  test('ввод названия не включает показ', async ({ page }) => {
    await editor.clickStage({ x: 400, y: 300 });
    await page.getByRole('textbox', { name: 'Название' }).click();

    await page.keyboard.type(' ');

    await expect(editor.button('Показ (Space)')).toBeVisible();
  });
});
