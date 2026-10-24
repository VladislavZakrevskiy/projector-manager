import { expect, test } from '@playwright/test';

import { makeBeatWav } from './lib/make-wav';
import { EditorPage } from './pages/editor-page';

test.describe('музыка', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.openClean();
  });

  test('без источника показывает демо-бит', async ({ page }) => {
    await expect(page.getByText('Демо-бит 124 BPM')).toBeVisible();
  });

  test('индикаторы уровней двигаются под демо-бит', async ({ page }) => {
    await expect.poll(async () => Number(await page.getByRole('meter', { name: 'средние' }).getAttribute('aria-valuenow'))).toBeGreaterThan(0);
  });

  test('проигрывает и анализирует выбранный файл', async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles({ name: 'beat.wav', mimeType: 'audio/wav', buffer: makeBeatWav(4) });

    await expect(page.getByText('Звук включён')).toBeVisible();
  });

  test('показывает уровни выбранного файла', async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles({ name: 'beat.wav', mimeType: 'audio/wav', buffer: makeBeatWav(4) });

    await expect.poll(async () => Number(await page.getByRole('meter', { name: 'бас' }).getAttribute('aria-valuenow'))).toBeGreaterThan(0);
  });

  test('показывает доступные аудиовходы при открытии списка', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Источник звука' }).click();

    await expect(page.getByRole('option').first()).toBeVisible();
  });

  test('включает звук после выбора аудиовхода', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Источник звука' }).click();
    await page.getByRole('option').first().click();

    await expect(page.getByText('Звук включён')).toBeVisible();
  });

  test('подсказывает, как подключить музыку из других приложений', async ({ page }) => {
    await expect(page.getByText(/BlackHole 2ch/)).toBeVisible();
  });
});
