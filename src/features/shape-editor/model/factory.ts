import { createEvent, createStore, sample } from 'effector';
import type { EventCallable } from 'effector';

import { EFFECT_ID } from '~/entities/effect';
import type { NewShape, ShapeChange } from '~/entities/shape';
import type { Point } from '~/shared/lib/geometry';

import { EDGE_HIT_DISTANCE, MIN_POLYGON_POINTS } from '../lib/constants';
import { clampPoint, insertVertex, isClosingPoint, isNewPoint, moveVertex, removeVertex, translatePolygon } from '../lib/edit-polygon';
import type { ShapeDrag, ShapeEditorShapes, VertexDrag, VertexInsert, VertexRemove } from '../types';

export type ShapeEditorDeps = {
  shapes: ShapeEditorShapes;
  random: () => number;
};

const DEFAULT_COLOR_1 = '#00e5ff';
const DEFAULT_COLOR_2 = '#ff2bd6';
const MAX_POINTS = 32;

export function createShapeEditorFeature(deps: ShapeEditorDeps) {
  // 2. Events
  const drawingStarted = createEvent();
  const pointPlaced = createEvent<Point>();
  const drawingFinished = createEvent();
  const drawingCancelled = createEvent();
  const vertexDragged = createEvent<VertexDrag>();
  const shapeDragged = createEvent<ShapeDrag>();
  const vertexInsertRequested = createEvent<VertexInsert>();
  const vertexRemoveRequested = createEvent<VertexRemove>();
  const selectedShapeRemoveRequested = createEvent();

  // 3. Stores
  const $isDrawing = createStore(false);
  const $draftPoints = createStore<Point[]>([]);

  // 5. Sample
  // === Рисование нового полигона ===
  sample({
    clock: drawingStarted,
    fn: () => true,
    target: $isDrawing,
  });

  sample({
    clock: drawingStarted,
    fn: () => null,
    target: deps.shapes.shapeSelected,
  });

  sample({
    clock: pointPlaced,
    source: { isDrawing: $isDrawing, draft: $draftPoints },
    filter: ({ isDrawing, draft }, point) => isDrawing && draft.length < MAX_POINTS && !isClosingPoint(draft, point) && isNewPoint(draft, point),
    fn: ({ draft }, point) => [...draft, clampPoint(point)],
    target: $draftPoints,
  });

  // Клик по первой точке замыкает полигон
  sample({
    clock: pointPlaced,
    source: { isDrawing: $isDrawing, draft: $draftPoints },
    filter: ({ isDrawing, draft }, point) => isDrawing && isClosingPoint(draft, point),
    target: drawingFinished,
  });

  sample({
    clock: drawingFinished,
    source: { draft: $draftPoints, shapes: deps.shapes.$shapes },
    filter: ({ draft }) => draft.length >= MIN_POLYGON_POINTS,
    fn: ({ draft, shapes }): NewShape => ({
      name: `Фигура ${shapes.length + 1}`,
      points: draft,
      effectId: EFFECT_ID.NEON,
      color1: DEFAULT_COLOR_1,
      color2: DEFAULT_COLOR_2,
      speed: 1,
      phase: deps.random(),
    }),
    target: deps.shapes.shapeAdded,
  });

  // Меньше трёх точек — полигона нет, это отмена
  sample({
    clock: drawingFinished,
    source: $draftPoints,
    filter: (draft) => draft.length < MIN_POLYGON_POINTS,
    target: drawingCancelled,
  });

  // Сброс черновика идёт от shapeAdded и drawingCancelled, а не от drawingFinished:
  // так добавление фигуры гарантированно читает черновик раньше, чем он очистится
  sample({
    clock: [deps.shapes.shapeAdded, drawingCancelled],
    fn: () => false,
    target: $isDrawing,
  });

  sample({
    clock: [deps.shapes.shapeAdded, drawingCancelled],
    fn: (): Point[] => [],
    target: $draftPoints,
  });

  // === Правка выбранной фигуры ===
  const shapeChangeComputed = createEvent<ShapeChange | null>();

  sample({
    clock: shapeChangeComputed,
    filter: isShapeChange,
    target: deps.shapes.shapeChanged,
  });

  function connectPointsEdit<T extends { shapeId: string }>(clock: EventCallable<T>, edit: (points: Point[], payload: T) => Point[] | null) {
    sample({
      clock,
      source: deps.shapes.$shapes,
      fn: (shapes, payload): ShapeChange | null => {
        const shape = shapes.find((candidate) => candidate.id === payload.shapeId);
        const points = shape ? edit(shape.points, payload) : null;

        return shape && points ? { id: shape.id, changes: { points } } : null;
      },
      target: shapeChangeComputed,
    });
  }

  connectPointsEdit(vertexDragged, (points, { index, point }) => moveVertex(points, index, point));
  connectPointsEdit(shapeDragged, (points, { dx, dy }) => translatePolygon(points, dx, dy));
  connectPointsEdit(vertexInsertRequested, (points, { point }) => insertVertex(points, point, EDGE_HIT_DISTANCE));
  connectPointsEdit(vertexRemoveRequested, (points, { index }) => removeVertex(points, index));

  sample({
    clock: selectedShapeRemoveRequested,
    source: deps.shapes.$selectedId,
    filter: isString,
    target: deps.shapes.shapeRemoved,
  });

  // 6. Return
  return {
    $shapes: deps.shapes.$shapes,
    $selectedId: deps.shapes.$selectedId,
    $selectedShape: deps.shapes.$selectedShape,
    $isDrawing,
    $draftPoints,
    shapeSelected: deps.shapes.shapeSelected,
    shapeChanged: deps.shapes.shapeChanged,
    drawingStarted,
    pointPlaced,
    drawingFinished,
    drawingCancelled,
    vertexDragged,
    shapeDragged,
    vertexInsertRequested,
    vertexRemoveRequested,
    selectedShapeRemoveRequested,
  };
}

export type ShapeEditorFeature = ReturnType<typeof createShapeEditorFeature>;

// Type guards для filter в sample
function isShapeChange(change: ShapeChange | null): change is ShapeChange {
  return change !== null;
}

function isString(value: string | null): value is string {
  return value !== null;
}
