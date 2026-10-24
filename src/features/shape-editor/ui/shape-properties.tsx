import { Button, Select, Slider, Text, TextInput } from '@gravity-ui/uikit';
import { useUnit } from 'effector-react';
import type { ChangeEvent } from 'react';

import { EFFECTS } from '~/entities/effect';

import type { ShapeEditorFeature } from '../model';

import styles from './shape-properties.module.css';

type ShapePropertiesProps = {
  model: ShapeEditorFeature;
};

const EFFECT_OPTIONS = EFFECTS.filter((effect) => effect.isSelectable).map((effect) => ({ value: effect.id, content: effect.name }));
const MIN_SPEED = 0.2;
const MAX_SPEED = 3;
const SPEED_STEP = 0.1;

export function ShapeProperties({ model }: ShapePropertiesProps) {
  const [shape, changeShape, removeShape] = useUnit([model.$selectedShape, model.shapeChanged, model.selectedShapeRemoveRequested]);

  if (!shape) {
    return null;
  }

  const shapeId = shape.id;

  const handleNameUpdate = (name: string) => changeShape({ id: shapeId, changes: { name } });
  const handleEffectUpdate = (values: string[]) => {
    const [effectId] = values;

    if (effectId) {
      changeShape({ id: shapeId, changes: { effectId } });
    }
  };
  const handleColor1Change = (event: ChangeEvent<HTMLInputElement>) => changeShape({ id: shapeId, changes: { color1: event.target.value } });
  const handleColor2Change = (event: ChangeEvent<HTMLInputElement>) => changeShape({ id: shapeId, changes: { color2: event.target.value } });
  const handleSpeedUpdate = (speed: number) => changeShape({ id: shapeId, changes: { speed } });

  return (
    <div className={styles.root}>
      <TextInput label="Название" value={shape.name} onUpdate={handleNameUpdate} />
      <Select label="Эффект" width="max" value={[shape.effectId]} options={EFFECT_OPTIONS} onUpdate={handleEffectUpdate} />
      <div className={styles.colors}>
        <label className={styles.color}>
          <Text color="secondary">Цвет 1</Text>
          <input type="color" value={shape.color1} onChange={handleColor1Change} />
        </label>
        <label className={styles.color}>
          <Text color="secondary">Цвет 2</Text>
          <input type="color" value={shape.color2} onChange={handleColor2Change} />
        </label>
      </div>
      <div className={styles.speed}>
        <Text color="secondary">Скорость</Text>
        <Slider value={shape.speed} min={MIN_SPEED} max={MAX_SPEED} step={SPEED_STEP} onUpdate={handleSpeedUpdate} />
      </div>
      <Button view="outlined-danger" onClick={removeShape}>
        Удалить (Del)
      </Button>
    </div>
  );
}
