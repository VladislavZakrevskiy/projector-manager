import { Button, Text } from '@gravity-ui/uikit';
import { useUnit } from 'effector-react';

import type { ShapeEditorFeature } from '../model';

import styles from './shape-list.module.css';

type ShapeListProps = {
  model: ShapeEditorFeature;
};

export function ShapeList({ model }: ShapeListProps) {
  const [shapes, selectedId, selectShape] = useUnit([model.$shapes, model.$selectedId, model.shapeSelected]);

  if (shapes.length === 0) {
    return <Text color="secondary">Фигур пока нет. Нажми «+ Фигура» и обведи предмет на стене.</Text>;
  }

  return (
    <ul className={styles.root}>
      {shapes.map((shape) => (
        <li key={shape.id}>
          <Button width="max" view={shape.id === selectedId ? 'normal' : 'flat'} selected={shape.id === selectedId} onClick={() => selectShape(shape.id)}>
            {shape.name}
          </Button>
        </li>
      ))}
    </ul>
  );
}
