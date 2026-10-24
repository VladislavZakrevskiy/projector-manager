import { Button } from '@gravity-ui/uikit';
import { useUnit } from 'effector-react';

import type { ShapeEditorFeature } from '../model';

type DrawShapeButtonProps = {
  model: ShapeEditorFeature;
};

export function DrawShapeButton({ model }: DrawShapeButtonProps) {
  const [isDrawing, startDrawing, cancelDrawing] = useUnit([model.$isDrawing, model.drawingStarted, model.drawingCancelled]);

  return (
    <Button view={isDrawing ? 'outlined-danger' : 'action'} onClick={isDrawing ? cancelDrawing : startDrawing}>
      {isDrawing ? 'Отмена (Esc)' : '+ Фигура'}
    </Button>
  );
}
