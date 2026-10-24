import { useEffect, useRef } from 'react';

import type { StageFrame } from '~/shared/contracts';

import { createStageRenderer } from '../lib/stage-renderer';
import type { StageRenderer } from '../lib/stage-renderer';

import styles from './stage-view.module.css';

type StageViewProps = {
  // Вызывается каждый кадр; null — оставить предыдущую картинку
  getFrame: () => StageFrame | null;
  className?: string;
};

export function StageView({ getFrame, className }: StageViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const getFrameRef = useRef(getFrame);

  useEffect(() => {
    getFrameRef.current = getFrame;
  }, [getFrame]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    // Свой canvas на каждый монтаж: иначе StrictMode инициализирует WebGL дважды на одном элементе
    const canvas = document.createElement('canvas');
    let renderer: StageRenderer | null = null;
    let isDisposed = false;
    let animationFrameId = 0;

    container.appendChild(canvas);

    function loop() {
      const frame = getFrameRef.current();

      if (frame) {
        renderer?.render(frame);
      }

      animationFrameId = requestAnimationFrame(loop);
    }

    createStageRenderer(canvas).then((created) => {
      if (isDisposed) {
        created.destroy();

        return;
      }

      renderer = created;
      loop();
    });

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);
      renderer?.destroy();
      canvas.remove();
    };
  }, []);

  return <div ref={containerRef} role="img" aria-label="Сцена проектора" className={className ? `${styles.root} ${className}` : styles.root} />;
}
