import { shapeEntity } from '~/entities/shape';

import { createShapeEditorFeature } from './factory';

export { createShapeEditorFeature } from './factory';
export type { ShapeEditorDeps, ShapeEditorFeature } from './factory';

export const shapeEditorFeature = createShapeEditorFeature({
  shapes: shapeEntity,
  random: Math.random,
});
