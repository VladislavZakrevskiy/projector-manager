import { allSettled, fork } from 'effector';
import { describe, expect, rs, test } from '@rstest/core';

import type { StageFrame } from '~/shared/contracts';

import type { FrameChannel } from '../lib/frame-channel';

import { createProjectorOutputFeature } from './factory';

function createChannel(overrides: Partial<FrameChannel> = {}): FrameChannel {
  return { send: () => undefined, subscribe: () => () => undefined, ...overrides };
}

describe('ProjectorOutputFeature', () => {
  test('opens the output window on request', async () => {
    const openWindow = rs.fn();
    const feature = createProjectorOutputFeature({ openWindow, channel: createChannel() });
    const scope = fork();

    await allSettled(feature.openRequested, { scope });

    expect(openWindow).toHaveBeenCalledTimes(1);
  });

  test('sends frames through the channel', () => {
    const send = rs.fn();
    const feature = createProjectorOutputFeature({ openWindow: () => undefined, channel: createChannel({ send }) });
    const frame: StageFrame = { time: 1, audio: { bass: 0, mid: 0, high: 0, beat: 0 }, shapes: [] };

    feature.sendFrame(frame);

    expect(send).toHaveBeenCalledWith(frame);
  });
});
