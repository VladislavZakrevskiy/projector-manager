import { createEvent, createStore, sample } from 'effector';

export function createPlaybackFeature() {
  // 2. Events
  const showToggled = createEvent();
  const autoToggled = createEvent();
  const blackoutToggled = createEvent();

  // 3. Stores
  const $isShowing = createStore(false);
  const $isAuto = createStore(false);
  const $isBlackout = createStore(false);

  // 5. Sample
  sample({ clock: showToggled, source: $isShowing, fn: (isShowing) => !isShowing, target: $isShowing });
  sample({ clock: autoToggled, source: $isAuto, fn: (isAuto) => !isAuto, target: $isAuto });
  sample({ clock: blackoutToggled, source: $isBlackout, fn: (isBlackout) => !isBlackout, target: $isBlackout });

  // Авто-режим имеет смысл только в показе, поэтому его включение сразу выходит из редактора
  sample({
    clock: $isAuto,
    filter: (isAuto) => isAuto,
    fn: () => true,
    target: $isShowing,
  });

  // 6. Return
  return { $isShowing, $isAuto, $isBlackout, showToggled, autoToggled, blackoutToggled };
}

export type PlaybackFeature = ReturnType<typeof createPlaybackFeature>;
