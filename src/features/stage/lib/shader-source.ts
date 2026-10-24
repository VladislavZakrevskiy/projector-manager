import { MAX_SHAPE_POINTS } from '~/shared/config';

export const VERTEX_SOURCE = `#version 300 es
in vec2 aPosition;
void main() { gl_Position = vec4(aPosition, 0., 1.); }`;

// Каждая фигура рисуется полноэкранным квадом; полигон считается в шейдере как SDF.
// effectGlsl — тело функции effect() из каталога эффектов.
export function createFragmentSource(effectGlsl: string): string {
  return `#version 300 es
precision highp float;

uniform vec2 uRes;
uniform float uT;
uniform int uN;
uniform vec2 uPts[${MAX_SHAPE_POINTS}];
uniform float uCum[${MAX_SHAPE_POINTS}];
uniform float uPerim;
uniform vec2 uCen;
uniform float uSize;
uniform vec3 uC1;
uniform vec3 uC2;
uniform float uBass;
uniform float uMid;
uniform float uHigh;
uniform float uBeat;
uniform float uSpeed;
uniform float uPhase;
uniform float uGain;

out vec4 finalColor;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec3 hsv(float h) { return clamp(abs(mod(h * 6. + vec3(0., 4., 2.), 6.) - 3.) - 1., 0., 1.); }

// d — расстояние до контура (<0 внутри), s — позиция вдоль периметра 0..1
void polygon(vec2 p, out float d, out float s) {
  float minDist = 1e9;
  float arc = 0.;
  float sign = 1.;
  for (int i = 0; i < ${MAX_SHAPE_POINTS}; i++) {
    if (i >= uN) break;
    vec2 a = uPts[i];
    vec2 b = uPts[(i + 1) % uN];
    vec2 e = b - a;
    vec2 w = p - a;
    float h = clamp(dot(w, e) / max(dot(e, e), 1e-6), 0., 1.);
    float dist = length(w - e * h);
    if (dist < minDist) {
      minDist = dist;
      arc = uCum[i] + h * length(e);
    }
    bvec3 c = bvec3(p.y >= a.y, p.y < b.y, e.x * w.y > e.y * w.x);
    if (all(c) || all(not(c))) sign = -sign;
  }
  d = sign * minDist;
  s = arc / uPerim;
}

vec3 effect(vec2 p, float d, float s) {
${effectGlsl}
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  float d;
  float s;
  polygon(p, d, s);
  if (d > 40.) discard;
  vec3 color = effect(p, d, s);
  // Снаружи свечение плавно гаснет к границе отсечения, иначе виден жёсткий край
  if (d > 0.) color *= 1. - smoothstep(10., 40., d);
  finalColor = vec4(min(color * uGain, 1.), 1.);
}`;
}
