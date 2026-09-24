import test from 'node:test';
import assert from 'node:assert/strict';
import { drawSkeleton } from '../../src/features/pose-analysis/rendering/skeletonRenderer';
import { attentionFrame } from './fixtures/pose/attention';

test('canvas draws detected shoulders without legs and skips invalid endpoints', () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { devicePixelRatio: 2 } });
  try {
    const lines: number[][] = [], dots: number[][] = [];
    let start: number[] = [];
    const ctx = {
      setTransform() {}, clearRect() { lines.length = 0; dots.length = 0; }, beginPath() {},
      moveTo(x: number, y: number) { start = [x, y]; },
      lineTo(x: number, y: number) { lines.push([...start, x, y]); },
      stroke() {}, fill() {}, arc(x: number, y: number) { dots.push([x, y]); },
    };
    const canvas = {
      width: 0, height: 0,
      getBoundingClientRect: () => ({ width: 1280, height: 720 }),
      getContext: () => ctx,
    } as unknown as HTMLCanvasElement;
    const frame = attentionFrame();
    const left = frame.landmarks.leftShoulder!, right = frame.landmarks.rightShoulder!;
    left.image = { x: 0.25, y: 0.4, z: 0 };
    right.image = { x: 0.75, y: 0.4, z: 0 };
    frame.landmarks = { leftShoulder: left, rightShoulder: right,
      leftElbow: { ...left, image: { x: -0.2, y: 0.6, z: 0 } },
      rightElbow: { ...right, confidence: 0.1 },
    };
    drawSkeleton(canvas, frame);
    assert.deepEqual(lines, [[400, 288, 880, 288]]);
    assert.deepEqual(dots, [[400, 288], [880, 288]]);
    assert.equal(canvas.width, 2560);
    frame.personCount = 0;
    drawSkeleton(canvas, frame);
    assert.deepEqual(lines, []);
    assert.deepEqual(dots, []);
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});
