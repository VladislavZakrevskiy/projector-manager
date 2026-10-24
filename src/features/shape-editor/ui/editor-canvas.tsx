import { useUnit } from 'effector-react';
import { useRef } from 'react';
import type { MouseEvent, PointerEvent } from 'react';

import { STAGE_HEIGHT, STAGE_WIDTH } from '~/shared/config';
import type { Point } from '~/shared/lib/geometry';

import { VERTEX_HIT_RADIUS } from '../lib/constants';
import { findShapeAt, findVertexAt } from '../lib/hit-test';
import type { ShapeEditorFeature } from '../model';

import styles from './editor-canvas.module.css';

type EditorCanvasProps = {
  model: ShapeEditorFeature;
};

type DragState = { kind: 'vertex'; shapeId: string; index: number } | { kind: 'shape'; shapeId: string; last: Point };

const HANDLE_SIZE = 10;
const VIEW_BOX = `0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`;

// Прозрачный слой поверх сцены: рисование полигонов, выбор и перетаскивание фигур и вершин
export function EditorCanvas({ model }: EditorCanvasProps) {
  const { shapes, selectedShape, isDrawing, draftPoints, ...events } = useUnit({
    shapes: model.$shapes,
    selectedShape: model.$selectedShape,
    isDrawing: model.$isDrawing,
    draftPoints: model.$draftPoints,
    selectShape: model.shapeSelected,
    placePoint: model.pointPlaced,
    finishDrawing: model.drawingFinished,
    dragVertex: model.vertexDragged,
    dragShape: model.shapeDragged,
    insertVertex: model.vertexInsertRequested,
    removeVertex: model.vertexRemoveRequested,
  });
  const dragRef = useRef<DragState | null>(null);

  function toStagePoint(event: MouseEvent<SVGSVGElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();

    return {
      x: ((event.clientX - rect.left) * STAGE_WIDTH) / rect.width,
      y: ((event.clientY - rect.top) * STAGE_HEIGHT) / rect.height,
    };
  }

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    const point = toStagePoint(event);

    if (isDrawing) {
      events.placePoint(point);

      return;
    }

    const vertexIndex = selectedShape ? findVertexAt(selectedShape.points, point, VERTEX_HIT_RADIUS) : null;

    if (selectedShape && vertexIndex !== null) {
      if (event.altKey) {
        events.removeVertex({ shapeId: selectedShape.id, index: vertexIndex });
      } else {
        dragRef.current = { kind: 'vertex', shapeId: selectedShape.id, index: vertexIndex };
        event.currentTarget.setPointerCapture(event.pointerId);
      }

      return;
    }

    const hitShape = findShapeAt(shapes, point);

    events.selectShape(hitShape?.id ?? null);

    if (hitShape) {
      dragRef.current = { kind: 'shape', shapeId: hitShape.id, last: point };
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;

    if (!drag) {
      return;
    }

    const point = toStagePoint(event);

    if (drag.kind === 'vertex') {
      events.dragVertex({ shapeId: drag.shapeId, index: drag.index, point });

      return;
    }

    events.dragShape({ shapeId: drag.shapeId, dx: point.x - drag.last.x, dy: point.y - drag.last.y });
    drag.last = point;
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const handleDoubleClick = (event: MouseEvent<SVGSVGElement>) => {
    if (isDrawing) {
      events.finishDrawing();

      return;
    }

    if (selectedShape) {
      events.insertVertex({ shapeId: selectedShape.id, point: toStagePoint(event) });
    }
  };

  return (
    <svg
      className={isDrawing ? `${styles.root} ${styles.drawing}` : styles.root}
      viewBox={VIEW_BOX}
      preserveAspectRatio="none"
      role="application"
      aria-label="Область редактирования фигур"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleDoubleClick}
    >
      {selectedShape ? (
        <g>
          <polygon className={styles.selectedOutline} points={toSvgPoints(selectedShape.points)} />
          {selectedShape.points.map((point, index) => (
            <rect key={index} className={styles.handle} x={point.x - HANDLE_SIZE / 2} y={point.y - HANDLE_SIZE / 2} width={HANDLE_SIZE} height={HANDLE_SIZE} />
          ))}
        </g>
      ) : null}
      {isDrawing && draftPoints.length > 0 ? (
        <g>
          <polyline className={styles.draftLine} points={toSvgPoints(draftPoints)} />
          {draftPoints.map((point, index) => (
            <rect key={index} className={styles.draftHandle} x={point.x - HANDLE_SIZE / 2} y={point.y - HANDLE_SIZE / 2} width={HANDLE_SIZE} height={HANDLE_SIZE} />
          ))}
        </g>
      ) : null}
    </svg>
  );
}

function toSvgPoints(points: Point[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}
