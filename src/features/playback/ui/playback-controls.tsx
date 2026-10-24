import { Button } from '@gravity-ui/uikit';
import { useUnit } from 'effector-react';
import { useEffect } from 'react';

import type { PlaybackFeature } from '../model';

import styles from './playback-controls.module.css';

type PlaybackControlsProps = {
  model: PlaybackFeature;
};

// Поля ввода и списки сами обрабатывают клавиши (в том числе буквы и пробел)
const TEXT_ENTRY_SELECTOR = 'input, textarea, select, [contenteditable="true"], [role="combobox"], [role="listbox"]';
// Кнопки сами реагируют на пробел, поэтому Space для них не перехватываем, а буквы A/B работают и при фокусе на кнопке
const ACTIVATABLE_SELECTOR = 'button, a, [role="button"]';

export function PlaybackControls({ model }: PlaybackControlsProps) {
  const [isShowing, isAuto, isBlackout, toggleShow, toggleAuto, toggleBlackout] = useUnit([
    model.$isShowing,
    model.$isAuto,
    model.$isBlackout,
    model.showToggled,
    model.autoToggled,
    model.blackoutToggled,
  ]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target instanceof Element ? event.target : null;

      if (target?.closest(TEXT_ENTRY_SELECTOR)) {
        return;
      }

      if (event.key === ' ') {
        if (target?.closest(ACTIVATABLE_SELECTOR)) {
          return;
        }

        event.preventDefault();
        toggleShow();
      } else if (event.key === 'a' || event.key === 'A') {
        toggleAuto();
      } else if (event.key === 'b' || event.key === 'B') {
        toggleBlackout();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleShow, toggleAuto, toggleBlackout]);

  return (
    <div className={styles.root}>
      <Button view={isShowing ? 'action' : 'normal'} onClick={toggleShow}>
        {isShowing ? 'Редактор (Space)' : 'Показ (Space)'}
      </Button>
      <Button view={isAuto ? 'action' : 'normal'} onClick={toggleAuto}>
        Авто (A)
      </Button>
      <Button view={isBlackout ? 'action' : 'normal'} onClick={toggleBlackout}>
        Blackout (B)
      </Button>
    </div>
  );
}
