import { expect, test } from '@playwright/test';

import { EditorPage, SMALL_SQUARE, SQUARE } from './pages/editor-page';

test('весь сценарий проходит без ошибок в консоли', async ({ page }) => {
  const errors: string[] = [];
  const editor = new EditorPage(page);

  page.on('pageerror', (error) => errors.push(error.message));
  // Предупреждения драйвера GL про ReadPixels от скриншотов — шум, не ошибка приложения
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('GL Driver')) {
      errors.push(message.text());
    }
  });

  await editor.openClean();
  await editor.drawShape(SQUARE);
  await editor.drawShape(SMALL_SQUARE);
  await page.keyboard.press('Space');
  await page.keyboard.press('a');
  await page.waitForTimeout(1500);
  await page.keyboard.press('b');
  await page.keyboard.press('b');
  await page.keyboard.press('Space');
  await page.reload();
  await editor.stage.waitFor();

  expect(errors).toEqual([]);
});
