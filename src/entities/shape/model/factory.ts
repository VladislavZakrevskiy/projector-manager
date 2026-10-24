import { combine, createEffect, createEvent, createStore, sample } from 'effector';

import type { ShapeStorage } from '../api/shape-storage';
import type { NewShape, Shape, ShapeChange } from '../types';

export type ShapeEntityDeps = {
  storage: ShapeStorage;
  createId: () => string;
};

export function createShapeEntity(deps: ShapeEntityDeps) {
  // 1. Effects
  const saveShapesFx = createEffect((shapes: Shape[]) => deps.storage.save(shapes));

  // 2. Events
  const shapeAdded = createEvent<NewShape>();
  const shapeCreated = createEvent<Shape>();
  const shapeChanged = createEvent<ShapeChange>();
  const shapeRemoved = createEvent<string>();
  const shapeSelected = createEvent<string | null>();

  // 3. Stores
  const $shapes = createStore<Shape[]>(deps.storage.load());
  const $selectedId = createStore<string | null>(null);

  // 4. Derived stores
  const $selectedShape = combine($shapes, $selectedId, (shapes, selectedId) => shapes.find((shape) => shape.id === selectedId) ?? null);

  // 5. Sample
  sample({
    clock: shapeAdded,
    fn: (draft) => ({ ...draft, id: deps.createId() }),
    target: shapeCreated,
  });

  sample({
    clock: shapeCreated,
    source: $shapes,
    fn: (shapes, shape) => [...shapes, shape],
    target: $shapes,
  });

  // Только что добавленную фигуру сразу выбираем
  sample({
    clock: shapeCreated,
    fn: (shape) => shape.id,
    target: $selectedId,
  });

  sample({
    clock: shapeChanged,
    source: $shapes,
    fn: (shapes, { id, changes }) => shapes.map((shape) => (shape.id === id ? { ...shape, ...changes } : shape)),
    target: $shapes,
  });

  sample({
    clock: shapeRemoved,
    source: $shapes,
    fn: (shapes, id) => shapes.filter((shape) => shape.id !== id),
    target: $shapes,
  });

  sample({
    clock: shapeSelected,
    target: $selectedId,
  });

  // Выбранной фигуры больше нет — сбрасываем выбор
  sample({
    clock: shapeRemoved,
    source: $selectedId,
    filter: (selectedId, removedId) => selectedId === removedId,
    fn: () => null,
    target: $selectedId,
  });

  sample({
    clock: $shapes.updates,
    target: saveShapesFx,
  });

  // 6. Return
  return {
    $shapes,
    $selectedId,
    $selectedShape,
    shapeAdded,
    shapeChanged,
    shapeRemoved,
    shapeSelected,
  };
}

export type ShapeEntity = ReturnType<typeof createShapeEntity>;
