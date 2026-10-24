import { useUnit } from 'effector-react';
import { useEffect } from 'react';

import type { ShapeEditorFeature } from '../model';

const TEXT_FIELD_SELECTOR = 'input, textarea, select, [contenteditable="true"], [role="combobox"], [role="listbox"], [role="slider"]';

// Enter — замкнуть полигон, Esc — отменить рисование, Del — удалить выбранную фигуру
export function useShapeEditorHotkeys(model: ShapeEditorFeature) {
  const [finishDrawing, cancelDrawing, removeSelectedShape] = useUnit([model.drawingFinished, model.drawingCancelled, model.selectedShapeRemoveRequested]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.target instanceof Element && event.target.closest(TEXT_FIELD_SELECTOR)) {
        return;
      }

      if (event.key === 'Enter') {
        finishDrawing();
      } else if (event.key === 'Escape') {
        cancelDrawing();
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        removeSelectedShape();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [finishDrawing, cancelDrawing, removeSelectedShape]);
}
