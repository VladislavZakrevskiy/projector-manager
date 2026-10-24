import type { Effect } from './types';

export const EFFECT_ID = {
  EDGE_TRACE: 'edge-trace',
  NEON: 'neon',
  RIPPLES: 'ripples',
  PLASMA: 'plasma',
  SCANNER: 'scanner',
  BEAT_FILL: 'beat-fill',
  SPARKLES: 'sparkles',
  RAINBOW: 'rainbow',
  GRID: 'grid',
} as const;

export type EffectId = (typeof EFFECT_ID)[keyof typeof EFFECT_ID];

const EDGE_TRACE = `
  float t = uT * uSpeed;
  float edge = exp(-abs(d) / 3.);
  float glow = exp(-abs(d) / (6. + 10. * uBass));
  float k1 = fract(t * .25 + uPhase - s), k2 = fract(t * .25 + uPhase + .5 - s);
  float w = exp(-k1 * 7.) * smoothstep(0., .03, k1) + exp(-k2 * 7.) * smoothstep(0., .03, k2);
  vec3 c = mix(uC1, uC2, clamp(min(k1, k2) * 3., 0., 1.));
  return c * ((edge * 1.6 + glow * .5) * w + edge * .12) + uC1 * step(d, 0.) * .05 * (1. + uBass);
`;

const NEON = `
  float edge = exp(-abs(d) / 3.);
  float glow = exp(-abs(d) / (12. + 25. * uBass));
  float br = .7 + .5 * uBeat + .4 * uBass;
  return uC1 * (edge * 1.4 + glow * .6) * br + uC2 * step(d, 0.) * exp(d / 40.) * (.15 + .5 * uBass);
`;

const RIPPLES = `
  float t = uT * uSpeed;
  float edge = exp(-abs(d) / 3.);
  float v = fract(-d / 20. - t * .5);
  float ring = smoothstep(0., .08, v) * (1. - smoothstep(.08, .35, v));
  return mix(uC1, uC2, clamp(-d / uSize, 0., 1.)) * ring * step(d, 0.) * (.7 + uBeat * .6) + uC1 * edge * .8;
`;

const PLASMA = `
  float t = uT * uSpeed;
  float edge = exp(-abs(d) / 3.);
  vec2 q = p / uSize * 3.;
  float v = sin(q.x + t) + sin(q.y * 1.3 - t * 1.1) + sin((q.x + q.y) * .8 + t * .7) + sin(length(q - vec2(2.)) * 1.5 - t);
  v = smoothstep(.15, .85, v / 8. + .5);
  return mix(uC1, uC2, v) * (.3 + .7 * v) * (.6 + uMid * .8) * step(d, 0.) + uC2 * edge * .7;
`;

const SCANNER = `
  float t = uT * uSpeed;
  float edge = exp(-abs(d) / 3.);
  vec2 dir = vec2(cos(uPhase * 6.283), sin(uPhase * 6.283));
  float dist = dot(p - uCen, dir) - (fract(t * .18 + uPhase) - .5) * uSize * 2.4;
  float bar = exp(-abs(dist) / (5. + 10. * uBass));
  float trail = dist < 0. ? exp(dist / (uSize * .5)) : 0.;
  return uC1 * (bar * 1.6 + trail * .3) * step(d, 0.) + uC2 * edge * (.15 + 2. * exp(-abs(dist) / 50.));
`;

const BEAT_FILL = `
  float edge = exp(-abs(d) / 3.);
  float g = exp(d / (25. + uSize * .6 * uBeat));
  return mix(uC2, uC1, g) * step(d, 0.) * (.12 + .9 * uBeat + .3 * uBass) * (.4 + .6 * g) + uC1 * edge * (.5 + uBeat);
`;

const SPARKLES = `
  float t = uT * uSpeed;
  float edge = exp(-abs(d) / 3.);
  vec2 cell = floor(p / 16.);
  float h = hash(cell);
  float twinkle = pow(max(0., sin(t * 2.5 + h * 60.)), 6.);
  float star = (1. - smoothstep(0., 2.5 + uHigh * 3., length(p - (cell + .5) * 16.))) * twinkle * step(.55, h);
  return mix(uC1, uC2, hash(cell + 7.)) * star * 2. * step(d, 0.) + uC1 * edge * .5 + uC2 * step(d, 0.) * .04;
`;

const RAINBOW = `
  float t = uT * uSpeed;
  float edge = exp(-abs(d) / 3.);
  float glow = exp(-abs(d) / (12. + 25. * uBass));
  vec3 edgeColor = hsv(fract(s * 2. - t * .15));
  // Заливка красится от центра, а не от s: s внутри рвётся по медиальной оси
  vec3 fillColor = hsv(fract(length(p - uCen) / uSize - t * .15));
  return edgeColor * (edge * 1.4 + glow * .5) + fillColor * step(d, 0.) * (.15 + .2 * uMid) * (.5 + .5 * sin(d * .15 - t * 2.));
`;

const GRID = `
  return vec3(.9, .95, 1.) * smoothstep(2.5, 1., abs(d)) + vec3(.03) * step(d, 0.);
`;

export const EFFECTS: Effect[] = [
  { id: EFFECT_ID.EDGE_TRACE, name: 'Бегущий свет', glsl: EDGE_TRACE, isSelectable: true },
  { id: EFFECT_ID.NEON, name: 'Неон', glsl: NEON, isSelectable: true },
  { id: EFFECT_ID.RIPPLES, name: 'Волны от края', glsl: RIPPLES, isSelectable: true },
  { id: EFFECT_ID.PLASMA, name: 'Плазма', glsl: PLASMA, isSelectable: true },
  { id: EFFECT_ID.SCANNER, name: 'Сканер', glsl: SCANNER, isSelectable: true },
  { id: EFFECT_ID.BEAT_FILL, name: 'Вспышка на бит', glsl: BEAT_FILL, isSelectable: true },
  { id: EFFECT_ID.SPARKLES, name: 'Искры', glsl: SPARKLES, isSelectable: true },
  { id: EFFECT_ID.RAINBOW, name: 'Радуга', glsl: RAINBOW, isSelectable: true },
  // Сервисный контур для подгонки по стене, в списке выбора не показывается
  { id: EFFECT_ID.GRID, name: 'Контур', glsl: GRID, isSelectable: false },
];
