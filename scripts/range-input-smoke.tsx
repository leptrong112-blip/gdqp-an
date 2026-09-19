// Development-only DOM regression harness. Lock is mocked here, never in the app.
import React, { useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { useRangeControls } from '../src/components/useRangeControls';
import { ADS_STORAGE_KEY, DEFAULT_ADS_ALIGNMENT, VISUAL_OFFSET_LIMIT_POS, moveLook, sanitizeAlignment } from '../src/components/rangeVisualConfig';

let controls: ReturnType<typeof useRangeControls>;
let fired = 0, ads = false;
function Fixture({ round = 0, active = true }: { round?: number; active?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  controls = useRangeControls(ref, { active, round, fire: () => fired++, ads: value => { ads = value; }, release: () => { ads = false; } });
  return <div ref={ref} tabIndex={0} id="game"><button id="hud">HUD</button></div>;
}
const root = createRoot(document.getElementById('fixture')!);
const lines: string[] = [];
const assert = (condition: boolean, name: string) => { if (!condition) throw new Error(name); lines.push(`PASS ${name}`); };
const update = (fn: () => void) => flushSync(fn);
const render = (round = 0, active = true) => update(() => root.render(<Fixture round={round} active={active} />));
const mouse = (type: string, button: number, buttons: number, target: EventTarget = document.getElementById('game')!) => update(() => target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button, buttons })));
const originalLock = Object.getOwnPropertyDescriptor(document, 'pointerLockElement');
const originalExit = document.exitPointerLock;
const saved = localStorage.getItem(ADS_STORAGE_KEY);
let owner: Element | null = null;
let requests = 0;
Object.defineProperty(document, 'pointerLockElement', { configurable: true, get: () => owner });
document.exitPointerLock = () => { owner = null; document.dispatchEvent(new Event('pointerlockchange')); };
try {
  render();
  const game = document.getElementById('game')!;
  game.requestPointerLock = () => { requests++; owner = game; document.dispatchEvent(new Event('pointerlockchange')); return Promise.resolve(); };
  mouse('mousedown', 0, 1, document.getElementById('hud')!);
  assert(requests === 0 && fired === 0, 'HUD does not lock or fire');
  mouse('mousedown', 0, 1);
  assert(controls!.locked && requests === 1 && fired === 0, 'acquire lock without firing');
  mouse('mouseup', 0, 0, document);
  mouse('mousedown', 2, 2);
  assert(ads && fired === 0, 'right down activates ADS');
  // No second pointerdown: matches the browser's chorded mouse semantics.
  mouse('mousedown', 0, 3);
  assert(ads && fired === 1, 'left down while holding right fires exactly once with ADS');
  mouse('mouseup', 0, 2, document);
  assert(ads, 'left up preserves right-held ADS');
  mouse('mouseup', 2, 0, document);
  assert(!ads, 'right up releases ADS');
  const before = controls!.look.current.x;
  update(() => document.dispatchEvent(new MouseEvent('mousemove', { movementX: 20, movementY: -10 })));
  assert(controls!.look.current.x !== before && controls!.look.current.y > 0, 'relative movement updates look');
  update(() => document.exitPointerLock());
  assert(!controls!.locked && !ads, 'lock loss restores UI and releases ADS');
  mouse('mousedown', 0, 1);
  assert(controls!.locked && fired === 1, 'reacquire without extra shot');
  update(() => controls!.setPanel(true));
  await new Promise(resolve => setTimeout(resolve, 0));
  mouse('mousedown', 0, 1);
  assert(!controls!.locked && fired === 1, 'alignment preview exits lock and blocks firing');
  update(() => controls!.setAlignment({ ...DEFAULT_ADS_ALIGNMENT, cameraOffsetX: .012 }));
  update(() => root.render(null));
  render();
  assert(controls!.alignment.cameraOffsetX === .012, 'alignment persists across remount');
  update(() => controls!.setAlignment({ ...DEFAULT_ADS_ALIGNMENT }));
  assert(controls!.alignment.cameraOffsetX === 0, 'reset restores defaults');
  assert(sanitizeAlignment({ cameraOffsetX: Infinity, cameraOffsetY: 100 }).cameraOffsetX === 0 && sanitizeAlignment({ cameraOffsetY: 100 }).cameraOffsetY === VISUAL_OFFSET_LIMIT_POS, 'invalid and out-of-range settings sanitized');
  assert(Math.abs(moveLook({ x: 0, y: 0 }, 0, 1e6).y) === 1.2, 'pitch cannot flip');
  render(1, false);
  mouse('mousedown', 0, 1);
  assert(fired === 1, 'inactive round cannot fire');
  render(2, true);
  const touchGame = document.getElementById('game')!;
  update(() => touchGame.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'touch', bubbles: true })));
  mouse('mousedown', 0, 1);
  assert(requests === 2 && fired === 1, 'touch compatibility mouse events never lock or fire');
  update(() => root.render(null));
  mouse('mousedown', 0, 1, touchGame);
  update(() => document.dispatchEvent(new Event('pointerlockchange')));
  assert(fired === 1 && requests === 2, 'unmount removes old listeners');
} catch (error) { lines.push(`FAIL ${error instanceof Error ? error.message : error}`); }
finally {
  update(() => root.unmount());
  if (originalLock) Object.defineProperty(document, 'pointerLockElement', originalLock);
  else delete (document as unknown as Record<string, unknown>).pointerLockElement;
  document.exitPointerLock = originalExit;
  if (saved === null) localStorage.removeItem(ADS_STORAGE_KEY); else localStorage.setItem(ADS_STORAGE_KEY, saved);
  document.getElementById('results')!.textContent = lines.join('\n') + '\n(Mocked API test; real fullscreen/lock need browser checks.)';
}
