import { createFrameChannel } from '../lib/frame-channel';

import { createProjectorOutputFeature } from './factory';

export { createProjectorOutputFeature } from './factory';
export type { ProjectorOutputDeps, ProjectorOutputFeature } from './factory';

const OUTPUT_PATH = '/output';
const OUTPUT_WINDOW_NAME = 'projector-output';
const OUTPUT_WINDOW_FEATURES = 'popup,width=1280,height=720';

export const projectorOutputFeature = createProjectorOutputFeature({
  openWindow: () => {
    window.open(OUTPUT_PATH, OUTPUT_WINDOW_NAME, OUTPUT_WINDOW_FEATURES);
  },
  channel: createFrameChannel(),
});
