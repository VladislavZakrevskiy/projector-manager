import { createLocalShapeStorage } from '../api/shape-storage';

import { createShapeEntity } from './factory';

export { createShapeEntity } from './factory';
export type { ShapeEntity, ShapeEntityDeps } from './factory';

export const shapeEntity = createShapeEntity({
  storage: createLocalShapeStorage(),
  createId: () => crypto.randomUUID(),
});
