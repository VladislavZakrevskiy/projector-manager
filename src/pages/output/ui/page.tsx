import { useCallback, useEffect, useRef } from 'react';

import { projectorOutputFeature } from '~/features/projector-output';
import { StageView } from '~/features/stage';
import type { StageFrame } from '~/shared/contracts';

import styles from './page.module.css';

// Окно проектора: рисует последний кадр, присланный редактором. Двойной клик — полный экран.
export function OutputPage() {
  const latestFrameRef = useRef<StageFrame | null>(null);

  useEffect(
    () =>
      projectorOutputFeature.subscribeToFrames((frame) => {
        latestFrameRef.current = frame;
      }),
    [],
  );

  const getFrame = useCallback(() => latestFrameRef.current, []);

  const handleDoubleClick = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  return (
    <main className={styles.root} onDoubleClick={handleDoubleClick}>
      <StageView getFrame={getFrame} className={styles.stage} />
    </main>
  );
}
