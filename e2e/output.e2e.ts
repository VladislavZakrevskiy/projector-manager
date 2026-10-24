import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { EditorPage, SQUARE } from './pages/editor-page';

async function openOutputWindow(editor: EditorPage): Promise<EditorPage> {
  const popupPromise = editor.page.waitForEvent('popup');

  await editor.button('Окно проектора').click();

  const popup: Page = await popupPromise;

  await popup.waitForLoadState();

  return new EditorPage(popup);
}

test.describe('окно проектора', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.openClean();
    await editor.drawShape(SQUARE);
  });

  test('открывается отдельным окном на /output', async () => {
    const output = await openOutputWindow(editor);

    expect(output.page.url()).toMatch(/\/output$/);
  });

  test('показывает сцену', async () => {
    const output = await openOutputWindow(editor);

    await expect(output.stage).toBeVisible();
  });

  test('повторяет контуры редактора', async () => {
    const output = await openOutputWindow(editor);

    await expect.poll(() => output.getLitPixelRatio()).toBeGreaterThan(0);
  });

  test('повторяет показ редактора', async () => {
    const output = await openOutputWindow(editor);

    await editor.button('Показ (Space)').click();

    await expect.poll(() => output.getLitPixelRatio()).toBeGreaterThan(0.02);
  });

  test('гаснет вместе с редактором при Blackout', async () => {
    const output = await openOutputWindow(editor);
    await editor.button('Показ (Space)').click();
    await expect.poll(() => output.getLitPixelRatio()).toBeGreaterThan(0.02);

    await editor.button('Blackout (B)').click();

    await expect.poll(() => output.getLitPixelRatio()).toBe(0);
  });

  test('получает новые фигуры без перезагрузки', async () => {
    const output = await openOutputWindow(editor);
    await expect.poll(() => output.getLitPixelRatio()).toBeGreaterThan(0);
    const before = await output.getLitPixelRatio();

    await editor.drawShape([{ x: 800, y: 100 }, { x: 1100, y: 100 }, { x: 1100, y: 400 }, { x: 800, y: 400 }]);

    await expect.poll(() => output.getLitPixelRatio()).toBeGreaterThan(before);
  });

  test('до первого кадра показывает чёрный экран', async ({ browser }) => {
    // Отдельный контекст: BroadcastChannel не пересекается с открытым редактором
    const isolatedContext = await browser.newContext();
    const output = new EditorPage(await isolatedContext.newPage());

    await output.page.goto('/output');
    await output.stage.waitFor();

    expect(await output.getLitPixelRatio()).toBe(0);

    await isolatedContext.close();
  });
});
