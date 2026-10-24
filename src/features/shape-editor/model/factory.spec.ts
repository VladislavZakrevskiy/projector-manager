import { allSettled, fork } from 'effector';
import { describe, expect, test } from '@rstest/core';

import { createShapeEntity } from '~/entities/shape';
import type { Shape } from '~/entities/shape';

import { createShapeEditorFeature } from './factory';

const TRIANGLE_POINTS = [
  { x: 100, y: 100 },
  { x: 200, y: 100 },
  { x: 150, y: 200 },
];

function createShape(id: string, points = TRIANGLE_POINTS): Shape {
  return { id, name: id, points, effectId: 'neon', color1: '#00e5ff', color2: '#ff2bd6', speed: 1, phase: 0 };
}

function createEditor(initialShapes: Shape[] = []) {
  let counter = 0;
  const entity = createShapeEntity({
    storage: { load: () => initialShapes, save: () => undefined },
    createId: () => `id-${++counter}`,
  });
  const editor = createShapeEditorFeature({ shapes: entity, random: () => 0.5 });

  return { entity, editor };
}

describe('ShapeEditorFeature drawing', () => {
  test('adds a shape from three placed points', async () => {
    const { entity, editor } = createEditor();
    const scope = fork();

    await allSettled(editor.drawingStarted, { scope });
    await allSettled(editor.pointPlaced, { scope, params: { x: 100, y: 100 } });
    await allSettled(editor.pointPlaced, { scope, params: { x: 200, y: 100 } });
    await allSettled(editor.pointPlaced, { scope, params: { x: 150, y: 200 } });
    await allSettled(editor.drawingFinished, { scope });

    expect(scope.getState(entity.$shapes).map((shape) => shape.points)).toEqual([TRIANGLE_POINTS]);
  });

  test('names the new shape by its order', async () => {
    const { entity, editor } = createEditor([createShape('existing')]);
    const scope = fork();

    await allSettled(editor.drawingStarted, { scope });
    await allSettled(editor.pointPlaced, { scope, params: { x: 100, y: 100 } });
    await allSettled(editor.pointPlaced, { scope, params: { x: 200, y: 100 } });
    await allSettled(editor.pointPlaced, { scope, params: { x: 150, y: 200 } });
    await allSettled(editor.drawingFinished, { scope });

    expect(scope.getState(entity.$shapes).map((shape) => shape.name)).toEqual(['existing', 'Фигура 2']);
  });

  test('closes the polygon when the first point is clicked again', async () => {
    const { entity, editor } = createEditor();
    const scope = fork();

    await allSettled(editor.drawingStarted, { scope });
    await allSettled(editor.pointPlaced, { scope, params: { x: 100, y: 100 } });
    await allSettled(editor.pointPlaced, { scope, params: { x: 200, y: 100 } });
    await allSettled(editor.pointPlaced, { scope, params: { x: 150, y: 200 } });
    await allSettled(editor.pointPlaced, { scope, params: { x: 102, y: 101 } });

    expect(scope.getState(entity.$shapes)).toHaveLength(1);
  });

  test('stops drawing after the polygon is closed', async () => {
    const { editor } = createEditor();
    const scope = fork();

    await allSettled(editor.drawingStarted, { scope });
    await allSettled(editor.pointPlaced, { scope, params: { x: 100, y: 100 } });
    await allSettled(editor.pointPlaced, { scope, params: { x: 200, y: 100 } });
    await allSettled(editor.pointPlaced, { scope, params: { x: 150, y: 200 } });
    await allSettled(editor.drawingFinished, { scope });

    expect(scope.getState(editor.$isDrawing)).toBe(false);
  });

  test('does not add a shape from two points', async () => {
    const { entity, editor } = createEditor();
    const scope = fork();

    await allSettled(editor.drawingStarted, { scope });
    await allSettled(editor.pointPlaced, { scope, params: { x: 100, y: 100 } });
    await allSettled(editor.pointPlaced, { scope, params: { x: 200, y: 100 } });
    await allSettled(editor.drawingFinished, { scope });

    expect(scope.getState(entity.$shapes)).toEqual([]);
  });

  test('ignores a duplicate of the last point', async () => {
    const { editor } = createEditor();
    const scope = fork();

    await allSettled(editor.drawingStarted, { scope });
    await allSettled(editor.pointPlaced, { scope, params: { x: 100, y: 100 } });
    await allSettled(editor.pointPlaced, { scope, params: { x: 101, y: 100 } });

    expect(scope.getState(editor.$draftPoints)).toHaveLength(1);
  });

  test('ignores points when drawing has not started', async () => {
    const { editor } = createEditor();
    const scope = fork();

    await allSettled(editor.pointPlaced, { scope, params: { x: 100, y: 100 } });

    expect(scope.getState(editor.$draftPoints)).toEqual([]);
  });

  test('clears the draft on cancel', async () => {
    const { editor } = createEditor();
    const scope = fork();

    await allSettled(editor.drawingStarted, { scope });
    await allSettled(editor.pointPlaced, { scope, params: { x: 100, y: 100 } });
    await allSettled(editor.drawingCancelled, { scope });

    expect(scope.getState(editor.$draftPoints)).toEqual([]);
  });

  test('deselects the current shape when drawing starts', async () => {
    const { entity, editor } = createEditor([createShape('a')]);
    const scope = fork({ values: [[entity.$selectedId, 'a']] });

    await allSettled(editor.drawingStarted, { scope });

    expect(scope.getState(entity.$selectedId)).toBeNull();
  });
});

describe('ShapeEditorFeature editing', () => {
  test('moves a dragged vertex', async () => {
    const { entity, editor } = createEditor([createShape('a')]);
    const scope = fork();

    await allSettled(editor.vertexDragged, { scope, params: { shapeId: 'a', index: 0, point: { x: 120, y: 90 } } });

    expect(scope.getState(entity.$shapes)[0]?.points[0]).toEqual({ x: 120, y: 90 });
  });

  test('moves the whole shape on drag', async () => {
    const { entity, editor } = createEditor([createShape('a')]);
    const scope = fork();

    await allSettled(editor.shapeDragged, { scope, params: { shapeId: 'a', dx: 10, dy: 5 } });

    expect(scope.getState(entity.$shapes)[0]?.points[0]).toEqual({ x: 110, y: 105 });
  });

  test('inserts a vertex on a double click near an edge', async () => {
    const { entity, editor } = createEditor([createShape('a')]);
    const scope = fork();

    await allSettled(editor.vertexInsertRequested, { scope, params: { shapeId: 'a', point: { x: 150, y: 102 } } });

    expect(scope.getState(entity.$shapes)[0]?.points).toHaveLength(4);
  });

  test('does not insert a vertex far from every edge', async () => {
    const { entity, editor } = createEditor([createShape('a')]);
    const scope = fork();

    await allSettled(editor.vertexInsertRequested, { scope, params: { shapeId: 'a', point: { x: 150, y: 140 } } });

    expect(scope.getState(entity.$shapes)[0]?.points).toHaveLength(3);
  });

  test('keeps a triangle when a vertex removal is requested', async () => {
    const { entity, editor } = createEditor([createShape('a')]);
    const scope = fork();

    await allSettled(editor.vertexRemoveRequested, { scope, params: { shapeId: 'a', index: 0 } });

    expect(scope.getState(entity.$shapes)[0]?.points).toHaveLength(3);
  });

  test('removes a vertex from a quad', async () => {
    const quad = [...TRIANGLE_POINTS, { x: 100, y: 200 }];
    const { entity, editor } = createEditor([createShape('a', quad)]);
    const scope = fork();

    await allSettled(editor.vertexRemoveRequested, { scope, params: { shapeId: 'a', index: 3 } });

    expect(scope.getState(entity.$shapes)[0]?.points).toEqual(TRIANGLE_POINTS);
  });

  test('ignores edits of an unknown shape', async () => {
    const { entity, editor } = createEditor([createShape('a')]);
    const scope = fork();

    await allSettled(editor.vertexDragged, { scope, params: { shapeId: 'missing', index: 0, point: { x: 1, y: 1 } } });

    expect(scope.getState(entity.$shapes)[0]?.points).toEqual(TRIANGLE_POINTS);
  });

  test('removes the selected shape', async () => {
    const { entity, editor } = createEditor([createShape('a'), createShape('b')]);
    const scope = fork({ values: [[entity.$selectedId, 'a']] });

    await allSettled(editor.selectedShapeRemoveRequested, { scope });

    expect(scope.getState(entity.$shapes).map((shape) => shape.id)).toEqual(['b']);
  });

  test('removes nothing when no shape is selected', async () => {
    const { entity, editor } = createEditor([createShape('a')]);
    const scope = fork();

    await allSettled(editor.selectedShapeRemoveRequested, { scope });

    expect(scope.getState(entity.$shapes)).toHaveLength(1);
  });
});
