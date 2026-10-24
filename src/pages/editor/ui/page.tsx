import { Text } from '@gravity-ui/uikit';
import { useUnit } from 'effector-react';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { shapeEntity } from '~/entities/shape';
import { AudioControls, audioAnalysisFeature } from '~/features/audio-analysis';
import { createDirector } from '~/features/auto-director';
import { PlaybackControls, playbackFeature } from '~/features/playback';
import { OpenOutputButton, projectorOutputFeature } from '~/features/projector-output';
import { DrawShapeButton, EditorCanvas, ShapeList, ShapeProperties, shapeEditorFeature, useShapeEditorHotkeys } from '~/features/shape-editor';
import { StageView } from '~/features/stage';
import type { StageFrame } from '~/shared/contracts';

import { buildFrame } from '../lib/build-frame';
import type { BuildFrameInput } from '../lib/build-frame';

import styles from './page.module.css';

type FrameSettings = Pick<BuildFrameInput, 'shapes' | 'selectedId' | 'isShowing' | 'isAuto' | 'isBlackout'>;

const MAX_FRAME_SECONDS = 0.1;
const MS_PER_SECOND = 1000;

export function EditorPage() {
  const { shapes, selectedId, isShowing, isAuto, isBlackout } = useUnit({
    shapes: shapeEntity.$shapes,
    selectedId: shapeEntity.$selectedId,
    isShowing: playbackFeature.$isShowing,
    isAuto: playbackFeature.$isAuto,
    isBlackout: playbackFeature.$isBlackout,
  });
  const director = useMemo(() => createDirector({ random: Math.random }), []);
  const settingsRef = useRef<FrameSettings>({ shapes, selectedId, isShowing, isAuto, isBlackout });
  const lastFrameAtRef = useRef(performance.now());

  useShapeEditorHotkeys(shapeEditorFeature);

  useEffect(() => {
    settingsRef.current = { shapes, selectedId, isShowing, isAuto, isBlackout };
  }, [shapes, selectedId, isShowing, isAuto, isBlackout]);

  // Горячий путь: каждый кадр считаем звук, собираем кадр, показываем у себя и шлём в окно проектора
  const getFrame = useCallback((): StageFrame => {
    const now = performance.now();
    const dt = Math.min(MAX_FRAME_SECONDS, (now - lastFrameAtRef.current) / MS_PER_SECOND);
    const audio = audioAnalysisFeature.readAudio(now, dt);

    lastFrameAtRef.current = now;

    const frame = buildFrame({
      ...settingsRef.current,
      time: now / MS_PER_SECOND,
      audio,
      getAutoLooks: (directorShapes) => director.update({ shapes: directorShapes, audio, dt, now }),
    });

    projectorOutputFeature.sendFrame(frame);

    return frame;
  }, [director]);

  return (
    <div className={styles.root}>
      <div className={styles.stage}>
        <div className={styles.screen}>
          <StageView getFrame={getFrame} className={styles.view} />
          {isShowing ? null : <EditorCanvas model={shapeEditorFeature} />}
        </div>
      </div>
      <aside className={styles.panel} aria-label="Панель управления">
        <section className={styles.section}>
          <PlaybackControls model={playbackFeature} />
          <div className={styles.row}>
            <DrawShapeButton model={shapeEditorFeature} />
            <OpenOutputButton model={projectorOutputFeature} />
          </div>
        </section>
        <section className={styles.section} aria-labelledby="music-title">
          <Text id="music-title" variant="subheader-2">
            Музыка
          </Text>
          <AudioControls model={audioAnalysisFeature} />
        </section>
        <section className={styles.section} aria-labelledby="shapes-title">
          <Text id="shapes-title" variant="subheader-2">
            Фигуры
          </Text>
          <ShapeList model={shapeEditorFeature} />
          <ShapeProperties model={shapeEditorFeature} />
        </section>
        <Text color="secondary" className={styles.hint}>
          Клик — точка, клик по первой точке или Enter — замкнуть. Тащи вершины и фигуры, двойной клик по ребру — новая вершина, Alt+клик по вершине — удалить. В редакторе проектор
          показывает контуры для подгонки по стене. Окно проектора перетащи на проектор и сделай двойной клик.
        </Text>
      </aside>
    </div>
  );
}
