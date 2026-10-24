import type { EventCallable, Store } from 'effector';

import type { NewShape, Shape, ShapeChange } from '~/entities/shape';
import type { Point } from '~/shared/lib/geometry';

// Узкий срез сущности shape: ровно то, что нужно редактору
export type ShapeEditorShapes = {
  $shapes: Store<Shape[]>;
  $selectedId: Store<string | null>;
  $selectedShape: Store<Shape | null>;
  shapeAdded: EventCallable<NewShape>;
  shapeChanged: EventCallable<ShapeChange>;
  shapeRemoved: EventCallable<string>;
  shapeSelected: EventCallable<string | null>;
};

export type VertexDrag = {
  shapeId: string;
  index: number;
  point: Point;
};

export type ShapeDrag = {
  shapeId: string;
  dx: number;
  dy: number;
};

export type VertexInsert = {
  shapeId: string;
  point: Point;
};

export type VertexRemove = {
  shapeId: string;
  index: number;
};
