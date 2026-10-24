// glsl — тело `vec3 effect(vec2 p, float d, float s)`:
//   p — пиксель сцены, d — расстояние до контура (<0 внутри), s — позиция вдоль периметра 0..1.
// Доступны uniform'ы: uT, uSpeed, uPhase, uC1, uC2, uBass, uMid, uHigh, uBeat, uSize, uCen.
export type Effect = {
  id: string;
  name: string;
  glsl: string;
  isSelectable: boolean;
};
