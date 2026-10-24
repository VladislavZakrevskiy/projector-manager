import { useEffect, useState } from 'react';

import type { AudioReading } from '~/shared/contracts';

import styles from './level-meters.module.css';

type LevelMetersProps = {
  getReading: () => AudioReading;
};

const REFRESH_INTERVAL_MS = 80;
const BAR_LABELS = ['бас', 'средние', 'высокие'];

// Индикаторы обновляются редко и сами опрашивают последний кадр: перерисовывать React 60 раз в секунду незачем
export function LevelMeters({ getReading }: LevelMetersProps) {
  const [levels, setLevels] = useState<number[]>([0, 0, 0]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const { bass, mid, high } = getReading().levels;

      setLevels([bass, mid, high]);
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [getReading]);

  return (
    <div className={styles.root}>
      {levels.map((level, index) => (
        <div key={BAR_LABELS[index]} className={styles.bar} role="meter" aria-label={BAR_LABELS[index]} aria-valuemin={0} aria-valuemax={1} aria-valuenow={level}>
          <div className={styles.fill} style={{ height: `${Math.round(level * 100)}%` }} />
        </div>
      ))}
    </div>
  );
}
