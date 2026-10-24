import { expect, test } from '@playwright/test';

import { EditorPage, SMALL_SQUARE, SQUARE } from './pages/editor-page';

test.describe('правка фигур', () => {
  let editor: EditorPage;

  test.beforeEach(async ({ page }) => {
    editor = new EditorPage(page);
    await editor.openClean();
    await editor.drawShape(SQUARE);
  });

  test('переименовывает фигуру', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Название' }).fill('Полка');

    await expect(editor.shapeButton('Полка')).toBeVisible();
  });

  test('меняет эффект фигуры', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Эффект' }).click();
    await page.getByRole('option', { name: 'Плазма' }).click();

    await expect.poll(async () => (await editor.getStoredShapes())[0]?.effectId).toBe('plasma');
  });

  test('меняет первый цвет', async ({ page }) => {
    await page.getByLabel('Цвет 1').fill('#ff0000');

    await expect.poll(async () => (await editor.getStoredShapes())[0]?.color1).toBe('#ff0000');
  });

  test('меняет скорость слайдером', async ({ page }) => {
    await page.getByRole('slider').focus();
    await page.keyboard.press('End');

    await expect.poll(async () => (await editor.getStoredShapes())[0]?.speed).toBe(3);
  });

  test('тащит вершину', async () => {
    await editor.dragOnStage(SQUARE[0]!, { x: 180, y: 120 });

    await expect.poll(async () => (await editor.getStoredShapes())[0]?.points[0]).toMatchObject({ x: expect.closeTo(180, -1), y: expect.closeTo(120, -1) });
  });

  test('не выпускает вершину за границы сцены', async () => {
    await editor.dragOnStage(SQUARE[0]!, { x: -200, y: -200 });

    await expect.poll(async () => (await editor.getStoredShapes())[0]?.points[0]).toEqual({ x: 0, y: 0 });
  });

  test('тащит всю фигуру за тело', async () => {
    await editor.dragOnStage({ x: 400, y: 300 }, { x: 450, y: 350 });

    await expect.poll(async () => (await editor.getStoredShapes())[0]?.points[0]).toMatchObject({ x: expect.closeTo(250, -1), y: expect.closeTo(200, -1) });
  });

  test('добавляет вершину двойным кликом по ребру', async () => {
    await editor.clickStage({ x: 400, y: 150 }, { clickCount: 2 });

    await expect.poll(async () => (await editor.getStoredShapes())[0]?.points.length).toBe(5);
  });

  test('не добавляет вершину далеко от рёбер', async () => {
    await editor.clickStage({ x: 400, y: 300 }, { clickCount: 2 });

    await expect.poll(async () => (await editor.getStoredShapes())[0]?.points.length).toBe(4);
  });

  test('удаляет вершину по Alt+клик', async ({ page }) => {
    await page.keyboard.down('Alt');
    await editor.clickStage(SQUARE[2]!);
    await page.keyboard.up('Alt');

    await expect.poll(async () => (await editor.getStoredShapes())[0]?.points.length).toBe(3);
  });

  test('не удаляет вершину у треугольника', async ({ page }) => {
    await page.keyboard.down('Alt');
    await editor.clickStage(SQUARE[2]!);
    await page.keyboard.up('Alt');
    await expect.poll(async () => (await editor.getStoredShapes())[0]?.points.length).toBe(3);

    await page.keyboard.down('Alt');
    await editor.clickStage(SQUARE[1]!);
    await page.keyboard.up('Alt');

    await expect.poll(async () => (await editor.getStoredShapes())[0]?.points.length).toBe(3);
  });

  test('удаляет выбранную фигуру клавишей Delete', async ({ page }) => {
    await page.keyboard.press('Delete');

    await expect(page.getByText('Фигур пока нет')).toBeVisible();
  });

  test('удаляет выбранную фигуру кнопкой', async ({ page }) => {
    await editor.button('Удалить (Del)').click();

    await expect(page.getByText('Фигур пока нет')).toBeVisible();
  });

  test('не удаляет фигуру, пока стираешь текст в названии', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Название' }).press('Backspace');

    await expect(page.getByRole('list').getByRole('button')).toHaveCount(1);
  });

  test('выбирает другую фигуру в списке', async ({ page }) => {
    await editor.drawShape(SMALL_SQUARE);

    await editor.shapeButton('Фигура 1').click();

    await expect(page.getByRole('textbox', { name: 'Название' })).toHaveValue('Фигура 1');
  });

  test('выбирает фигуру кликом по ней на сцене', async ({ page }) => {
    await editor.drawShape(SMALL_SQUARE);

    await editor.clickStage({ x: 400, y: 300 });

    await expect(page.getByRole('textbox', { name: 'Название' })).toHaveValue('Фигура 1');
  });

  test('снимает выбор кликом по пустому месту', async ({ page }) => {
    await editor.clickStage({ x: 1100, y: 600 });

    await expect(page.getByRole('textbox', { name: 'Название' })).toHaveCount(0);
  });
});
