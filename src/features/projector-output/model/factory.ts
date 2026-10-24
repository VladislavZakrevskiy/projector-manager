import { createEffect, createEvent, sample } from 'effector';

import type { FrameChannel } from '../lib/frame-channel';

export type ProjectorOutputDeps = {
  openWindow: () => void;
  channel: FrameChannel;
};

export function createProjectorOutputFeature(deps: ProjectorOutputDeps) {
  // 1. Effects
  const openWindowFx = createEffect(() => deps.openWindow());

  // 2. Events
  const openRequested = createEvent();

  // 5. Sample
  sample({ clock: openRequested, target: openWindowFx });

  // 6. Return
  return {
    openRequested,
    // Горячий путь: кадры идут мимо effector
    sendFrame: deps.channel.send,
    subscribeToFrames: deps.channel.subscribe,
  };
}

export type ProjectorOutputFeature = ReturnType<typeof createProjectorOutputFeature>;
