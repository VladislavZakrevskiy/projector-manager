import { Application, Geometry, GlProgram, Mesh, Shader, UniformGroup } from 'pixi.js';

import { EFFECTS } from '~/entities/effect';
import { MAX_SHAPE_POINTS, STAGE_HEIGHT, STAGE_WIDTH } from '~/shared/config';
import type { StageFrame, StageShapeFrame } from '~/shared/contracts';

import { writePolygonUniforms } from './polygon-uniforms';
import type { PolygonBuffers } from './polygon-uniforms';
import { VERTEX_SOURCE, createFragmentSource } from './shader-source';

export type StageRenderer = {
  render: (frame: StageFrame) => void;
  destroy: () => void;
};

type ShapeSlot = {
  effectId: string;
  mesh: Mesh<Geometry, Shader>;
  uniforms: UniformGroup;
  buffers: PolygonBuffers;
  center: Float32Array;
  color1: Float32Array;
  color2: Float32Array;
};

const QUAD_POSITIONS = new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]);
const QUAD_INDICES = new Uint16Array([0, 1, 2, 0, 2, 3]);

export async function createStageRenderer(canvas: HTMLCanvasElement): Promise<StageRenderer> {
  const app = new Application();

  await app.init({
    canvas,
    width: STAGE_WIDTH,
    height: STAGE_HEIGHT,
    background: 0x000000,
    preference: 'webgl',
    antialias: false,
    autoStart: false,
    autoDensity: false,
  });

  const geometry = new Geometry({
    attributes: { aPosition: { buffer: QUAD_POSITIONS, format: 'float32x2' } },
    indexBuffer: QUAD_INDICES,
  });
  const programs = new Map<string, GlProgram>();
  const slots: ShapeSlot[] = [];

  function getProgram(effectId: string): GlProgram | null {
    const cached = programs.get(effectId);

    if (cached) {
      return cached;
    }

    const effect = EFFECTS.find((candidate) => candidate.id === effectId);

    if (!effect) {
      return null;
    }

    const program = GlProgram.from({ vertex: VERTEX_SOURCE, fragment: createFragmentSource(effect.glsl), name: `effect-${effectId}` });

    programs.set(effectId, program);

    return program;
  }

  function createSlot(effectId: string): ShapeSlot | null {
    const program = getProgram(effectId);

    if (!program) {
      return null;
    }

    const buffers = { points: new Float32Array(MAX_SHAPE_POINTS * 2), edgeStartLengths: new Float32Array(MAX_SHAPE_POINTS) };
    const center = new Float32Array(2);
    const color1 = new Float32Array(3);
    const color2 = new Float32Array(3);
    const uniforms = new UniformGroup({
      uRes: { value: new Float32Array([STAGE_WIDTH, STAGE_HEIGHT]), type: 'vec2<f32>' },
      uT: { value: 0, type: 'f32' },
      uN: { value: 0, type: 'i32' },
      uPts: { value: buffers.points, type: 'vec2<f32>', size: MAX_SHAPE_POINTS },
      uCum: { value: buffers.edgeStartLengths, type: 'f32', size: MAX_SHAPE_POINTS },
      uPerim: { value: 1, type: 'f32' },
      uCen: { value: center, type: 'vec2<f32>' },
      uSize: { value: 1, type: 'f32' },
      uC1: { value: color1, type: 'vec3<f32>' },
      uC2: { value: color2, type: 'vec3<f32>' },
      uBass: { value: 0, type: 'f32' },
      uMid: { value: 0, type: 'f32' },
      uHigh: { value: 0, type: 'f32' },
      uBeat: { value: 0, type: 'f32' },
      uSpeed: { value: 1, type: 'f32' },
      uPhase: { value: 0, type: 'f32' },
      uGain: { value: 1, type: 'f32' },
    });
    const shader = new Shader({ glProgram: program, resources: { uniforms } });
    const mesh = new Mesh({ geometry, shader });

    mesh.blendMode = 'add';
    app.stage.addChild(mesh);

    return { effectId, mesh, uniforms, buffers, center, color1, color2 };
  }

  function destroySlot(slot: ShapeSlot) {
    app.stage.removeChild(slot.mesh);
    slot.mesh.destroy();
  }

  function writeShape(slot: ShapeSlot, shape: StageShapeFrame, frame: StageFrame) {
    const metrics = writePolygonUniforms(shape.points, slot.buffers);
    const values = slot.uniforms.uniforms;

    slot.color1.set(shape.color1);
    slot.color2.set(shape.color2);
    values.uT = frame.time;
    values.uN = metrics.count;
    values.uPerim = metrics.perimeter;
    slot.center[0] = metrics.centerX;
    slot.center[1] = metrics.centerY;
    values.uSize = metrics.radius;
    values.uBass = frame.audio.bass;
    values.uMid = frame.audio.mid;
    values.uHigh = frame.audio.high;
    values.uBeat = frame.audio.beat;
    values.uSpeed = shape.speed;
    values.uPhase = shape.phase;
    values.uGain = shape.gain;
  }

  return {
    render: (frame) => {
      frame.shapes.forEach((shape, index) => {
        const existing = slots[index];

        if (existing && existing.effectId !== shape.effectId) {
          destroySlot(existing);
          delete slots[index];
        }

        const slot = slots[index] ?? createSlot(shape.effectId);

        if (!slot) {
          return;
        }

        slots[index] = slot;
        slot.mesh.visible = shape.points.length >= 3;
        writeShape(slot, shape, frame);
      });

      slots.splice(frame.shapes.length).forEach(destroySlot);
      app.render();
    },
    destroy: () => {
      slots.forEach(destroySlot);
      app.destroy(false, { children: true });
    },
  };
}
