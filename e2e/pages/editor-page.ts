import type { Locator, Page } from '@playwright/test';

export type StagePoint = { x: number; y: number };

export type StoredShape = {
  id: string;
  name: string;
  points: StagePoint[];
  effectId: string;
  color1: string;
  color2: string;
  speed: number;
  phase: number;
};

const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 720;
const SHAPES_STORAGE_KEY = 'projector-manager:shapes';
// Пиксель считается «горящим», если сумма каналов выше порога
const LIT_PIXEL_THRESHOLD = 30;

export const SQUARE: StagePoint[] = [
  { x: 200, y: 150 },
  { x: 600, y: 150 },
  { x: 600, y: 450 },
  { x: 200, y: 450 },
];

export const SMALL_SQUARE: StagePoint[] = [
  { x: 800, y: 200 },
  { x: 900, y: 200 },
  { x: 900, y: 260 },
  { x: 800, y: 260 },
];

export class EditorPage {
  constructor(readonly page: Page) {}

  get stage(): Locator {
    return this.page.getByRole('img', { name: 'Сцена проектора' });
  }

  get editorSurface(): Locator {
    return this.page.getByRole('application', { name: 'Область редактирования фигур' });
  }

  button(name: string): Locator {
    return this.page.getByRole('button', { name });
  }

  async open() {
    await this.page.goto('/');
    await this.stage.waitFor();
  }

  async clearStorage() {
    await this.page.goto('/');
    await this.page.evaluate(() => localStorage.clear());
  }

  async openClean() {
    await this.clearStorage();
    await this.open();
  }

  // Координаты сцены (1280x720) → координаты окна браузера
  async toPagePoint(point: StagePoint): Promise<{ x: number; y: number }> {
    const box = await this.stage.boundingBox();

    if (!box) {
      throw new Error('Сцена не видна');
    }

    return { x: box.x + (point.x / STAGE_WIDTH) * box.width, y: box.y + (point.y / STAGE_HEIGHT) * box.height };
  }

  async clickStage(point: StagePoint, options: { clickCount?: number } = {}) {
    const { x, y } = await this.toPagePoint(point);

    await this.page.mouse.click(x, y, { clickCount: options.clickCount ?? 1 });
  }

  async dragOnStage(from: StagePoint, to: StagePoint) {
    const start = await this.toPagePoint(from);
    const end = await this.toPagePoint(to);

    await this.page.mouse.move(start.x, start.y);
    await this.page.mouse.down();
    await this.page.mouse.move(end.x, end.y, { steps: 6 });
    await this.page.mouse.up();
  }

  async drawShape(points: StagePoint[]) {
    await this.button('+ Фигура').click();

    for (const point of points) {
      await this.clickStage(point);
    }

    await this.page.keyboard.press('Enter');
  }

  shapeButton(name: string): Locator {
    return this.page.getByRole('list').getByRole('button', { name, exact: true });
  }

  async getStoredShapes(): Promise<StoredShape[]> {
    const raw = await this.page.evaluate((key) => localStorage.getItem(key), SHAPES_STORAGE_KEY);

    return raw ? JSON.parse(raw) : [];
  }

  // Доля «горящих» пикселей сцены: снимок браузера → canvas → подсчёт
  async getLitPixelRatio(target: Locator = this.stage): Promise<number> {
    const base64 = (await target.screenshot()).toString('base64');

    return target.page().evaluate(
      async ({ data, threshold }) => {
        const image = new Image();

        image.src = `data:image/png;base64,${data}`;
        await image.decode();

        const canvas = document.createElement('canvas');

        canvas.width = image.width;
        canvas.height = image.height;

        const context = canvas.getContext('2d');

        if (!context) {
          return 0;
        }

        context.drawImage(image, 0, 0);

        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let lit = 0;

        for (let offset = 0; offset < pixels.length; offset += 4) {
          if ((pixels[offset] ?? 0) + (pixels[offset + 1] ?? 0) + (pixels[offset + 2] ?? 0) > threshold) {
            lit++;
          }
        }

        return lit / (pixels.length / 4);
      },
      { data: base64, threshold: LIT_PIXEL_THRESHOLD },
    );
  }
}
