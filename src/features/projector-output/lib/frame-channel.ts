import type { StageFrame } from '~/shared/contracts';

export type FrameChannel = {
  send: (frame: StageFrame) => void;
  subscribe: (listener: (frame: StageFrame) => void) => () => void;
};

const CHANNEL_NAME = 'projector-manager:frames';

// Окна одного origin, обмен только собственными кадрами — валидацию данных не делаем
export function createFrameChannel(): FrameChannel {
  const channel = new BroadcastChannel(CHANNEL_NAME);

  return {
    send: (frame) => channel.postMessage(frame),
    subscribe: (listener) => {
      const handleMessage = (event: MessageEvent<StageFrame>) => listener(event.data);

      channel.addEventListener('message', handleMessage);

      return () => channel.removeEventListener('message', handleMessage);
    },
  };
}
