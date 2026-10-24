import { allSettled, fork } from 'effector';
import { describe, expect, rs, test } from '@rstest/core';

import type { ShapeStorage } from '../api/shape-storage';
import type { NewShape, Shape } from '../types';

import { createShapeEntity } from './factory';

function createDraft(overrides: Partial<NewShape> = {}): NewShape {
  return {
    name: 'Полка',
    points: [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ],
    effectId: 'neon',
    color1: '#00e5ff',
    color2: '#ff2bd6',
    speed: 1,
    phase: 0,
    ...overrides,
  };
}

function createStorage(initial: Shape[] = []): ShapeStorage {
  return { load: () => initial, save: rs.fn() };
}

function createIdGenerator() {
  let counter = 0;

  return () => `id-${++counter}`;
}

describe('ShapeEntity', () => {
  test('starts with shapes loaded from storage', () => {
    const stored: Shape = { ...createDraft({ name: 'Окно' }), id: 'stored-1' };
    const entity = createShapeEntity({ storage: createStorage([stored]), createId: createIdGenerator() });
    const scope = fork();

    expect(scope.getState(entity.$shapes)).toEqual([stored]);
  });

  test('adds a shape with a generated id', async () => {
    const entity = createShapeEntity({ storage: createStorage(), createId: createIdGenerator() });
    const scope = fork();

    await allSettled(entity.shapeAdded, { scope, params: createDraft({ name: 'Полка' }) });

    expect(scope.getState(entity.$shapes).map((shape) => [shape.id, shape.name])).toEqual([['id-1', 'Полка']]);
  });

  test('selects the shape right after it is added', async () => {
    const entity = createShapeEntity({ storage: createStorage(), createId: createIdGenerator() });
    const scope = fork();

    await allSettled(entity.shapeAdded, { scope, params: createDraft() });

    expect(scope.getState(entity.$selectedId)).toBe('id-1');
  });

  test('changes only the targeted shape', async () => {
    const first: Shape = { ...createDraft({ name: 'Первая' }), id: 'a' };
    const second: Shape = { ...createDraft({ name: 'Вторая' }), id: 'b' };
    const entity = createShapeEntity({ storage: createStorage([first, second]), createId: createIdGenerator() });
    const scope = fork();

    await allSettled(entity.shapeChanged, { scope, params: { id: 'b', changes: { effectId: 'plasma' } } });

    expect(scope.getState(entity.$shapes).map((shape) => shape.effectId)).toEqual(['neon', 'plasma']);
  });

  test('removes a shape from the list', async () => {
    const first: Shape = { ...createDraft(), id: 'a' };
    const second: Shape = { ...createDraft(), id: 'b' };
    const entity = createShapeEntity({ storage: createStorage([first, second]), createId: createIdGenerator() });
    const scope = fork();

    await allSettled(entity.shapeRemoved, { scope, params: 'a' });

    expect(scope.getState(entity.$shapes)).toEqual([second]);
  });

  test('clears selection when the selected shape is removed', async () => {
    const shape: Shape = { ...createDraft(), id: 'a' };
    const entity = createShapeEntity({ storage: createStorage([shape]), createId: createIdGenerator() });
    const scope = fork({ values: [[entity.$selectedId, 'a']] });

    await allSettled(entity.shapeRemoved, { scope, params: 'a' });

    expect(scope.getState(entity.$selectedId)).toBeNull();
  });

  test('keeps selection when another shape is removed', async () => {
    const first: Shape = { ...createDraft(), id: 'a' };
    const second: Shape = { ...createDraft(), id: 'b' };
    const entity = createShapeEntity({ storage: createStorage([first, second]), createId: createIdGenerator() });
    const scope = fork({ values: [[entity.$selectedId, 'a']] });

    await allSettled(entity.shapeRemoved, { scope, params: 'b' });

    expect(scope.getState(entity.$selectedId)).toBe('a');
  });

  test('exposes the selected shape', () => {
    const shape: Shape = { ...createDraft({ name: 'Окно' }), id: 'a' };
    const entity = createShapeEntity({ storage: createStorage([shape]), createId: createIdGenerator() });
    const scope = fork({ values: [[entity.$selectedId, 'a']] });

    expect(scope.getState(entity.$selectedShape)).toEqual(shape);
  });

  test('saves shapes to storage after a change', async () => {
    const storage = createStorage();
    const entity = createShapeEntity({ storage, createId: createIdGenerator() });
    const scope = fork();

    await allSettled(entity.shapeAdded, { scope, params: createDraft({ name: 'Полка' }) });

    expect(storage.save).toHaveBeenCalledWith([{ ...createDraft({ name: 'Полка' }), id: 'id-1' }]);
  });
});
