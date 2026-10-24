import type { Shape } from '../types';

export type ShapeStorage = {
  load: () => Shape[];
  save: (shapes: Shape[]) => void;
};

const STORAGE_KEY = 'projector-manager:shapes';

export function createLocalShapeStorage(): ShapeStorage {
  return {
    load: () => {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (raw === null) {
        return [];
      }

      try {
        const parsed: unknown = JSON.parse(raw);

        return isShapeList(parsed) ? parsed : [];
      } catch {
        return [];
      }
    },
    save: (shapes) => localStorage.setItem(STORAGE_KEY, JSON.stringify(shapes)),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPoint(value: unknown): boolean {
  return isRecord(value) && typeof value['x'] === 'number' && typeof value['y'] === 'number';
}

function isShape(value: unknown): value is Shape {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    typeof value['name'] === 'string' &&
    typeof value['effectId'] === 'string' &&
    typeof value['color1'] === 'string' &&
    typeof value['color2'] === 'string' &&
    typeof value['speed'] === 'number' &&
    typeof value['phase'] === 'number' &&
    Array.isArray(value['points']) &&
    value['points'].every(isPoint)
  );
}

function isShapeList(value: unknown): value is Shape[] {
  return Array.isArray(value) && value.every(isShape);
}
