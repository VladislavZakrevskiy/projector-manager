import { expect, test } from '@playwright/test';

import { EditorPage, SMALL_SQUARE, SQUARE } from './pages/editor-page';

test.describe('рисование фигур', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.openClean();
  });

  test('показывает пустое состояние, пока фигур нет', async ({ page }) => {
    await expect(page.getByText('Фигур пока нет')).toBeVisible();
  });

  test('добавляет фигуру после четырёх точек и Enter', async () => {
    await editor.drawShape(SQUARE);

    await expect(editor.shapeButton('Фигура 1')).toBeVisible();
  });

  test('замыкает полигон кликом по первой точке', async () => {
    await editor.button('+ Фигура').click();
    await editor.clickStage(SQUARE[0]!);
    await editor.clickStage(SQUARE[1]!);
    await editor.clickStage(SQUARE[2]!);

    await editor.clickStage(SQUARE[0]!);

    await expect(editor.shapeButton('Фигура 1')).toBeVisible();
  });

  test('замыкает полигон двойным кликом', async () => {
    await editor.button('+ Фигура').click();
    await editor.clickStage(SQUARE[0]!);
    await editor.clickStage(SQUARE[1]!);
    await editor.clickStage(SQUARE[2]!);

    await editor.clickStage({ x: 300, y: 450 }, { clickCount: 2 });

    await expect(editor.shapeButton('Фигура 1')).toBeVisible();
  });

  test('сохраняет координаты нарисованных точек', async () => {
    await editor.drawShape(SQUARE);

    await expect.poll(async () => (await editor.getStoredShapes())[0]?.points.length).toBe(4);
  });

  test('не добавляет фигуру из двух точек', async ({ page }) => {
    await editor.button('+ Фигура').click();
    await editor.clickStage(SQUARE[0]!);
    await editor.clickStage(SQUARE[1]!);

    await page.keyboard.press('Enter');

    await expect(page.getByText('Фигур пока нет')).toBeVisible();
  });

  test('отменяет рисование по Escape', async ({ page }) => {
    await editor.button('+ Фигура').click();
    await editor.clickStage(SQUARE[0]!);
    await editor.clickStage(SQUARE[1]!);
    await editor.clickStage(SQUARE[2]!);

    await page.keyboard.press('Escape');

    await expect(page.getByText('Фигур пока нет')).toBeVisible();
  });

  test('отменяет рисование кнопкой «Отмена»', async ({ page }) => {
    await editor.button('+ Фигура').click();
    await editor.clickStage(SQUARE[0]!);

    await editor.button('Отмена (Esc)').click();

    await expect(page.getByText('Фигур пока нет')).toBeVisible();
  });

  test('выбирает только что нарисованную фигуру', async ({ page }) => {
    await editor.drawShape(SQUARE);

    await expect(page.getByRole('textbox', { name: 'Название' })).toHaveValue('Фигура 1');
  });

  test('нумерует фигуры по порядку', async () => {
    await editor.drawShape(SQUARE);

    await editor.drawShape(SMALL_SQUARE);

    await expect(editor.shapeButton('Фигура 2')).toBeVisible();
  });

  test('сохраняет фигуры после перезагрузки страницы', async ({ page }) => {
    await editor.drawShape(SQUARE);

    await page.reload();

    await expect(editor.shapeButton('Фигура 1')).toBeVisible();
  });

  test('заканчивает рисование после замыкания полигона', async () => {
    await editor.drawShape(SQUARE);

    await expect(editor.button('+ Фигура')).toBeVisible();
  });
});
