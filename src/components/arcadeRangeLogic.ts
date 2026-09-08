export interface AmmoState { magazine: number; left: number; fired: number; reloads: number; reloading: boolean }
export interface ArcadeExercise { id: string; title: string; rounds: number; magazines: number; distance: number; moving: boolean; targets: number }
export const ARCADE_EXERCISES: ArcadeExercise[] = [
  { id: 'reload', title: 'Làm quen thay băng', rounds: 4, magazines: 3, distance: 10, moving: false, targets: 3 },
  { id: 'moving', title: 'Ba bia di động', rounds: 6, magazines: 3, distance: 100, moving: true, targets: 3 },
  { id: 'long', title: 'Thử thách đường bay', rounds: 5, magazines: 4, distance: 200, moving: true, targets: 3 },
];
export function initialAmmo(ex: ArcadeExercise): AmmoState { return { magazine: 1, left: ex.rounds, fired: 0, reloads: 0, reloading: false }; }
export function ammoAction(state: AmmoState, action: 'fire' | 'reload' | 'loaded', ex: ArcadeExercise): AmmoState {
  if (action === 'fire' && state.left > 0 && !state.reloading && state.fired < ex.rounds * ex.magazines)
    return { ...state, left: state.left - 1, fired: state.fired + 1 };
  if (action === 'reload' && state.left === 0 && !state.reloading && state.magazine < ex.magazines)
    return { ...state, reloading: true };
  if (action === 'loaded' && state.reloading)
    return { ...state, reloading: false, magazine: state.magazine + 1, left: ex.rounds, reloads: state.reloads + 1 };
  return state;
}

// Deliberately fictional animation timing and motion; no weapon calibration.
export function arcadeFlightSeconds(distance: number) { return .1 + Math.min(distance / 200, 1) * .1; }
export function arcadeTargetX(lane: number, width: number, time: number, moving: boolean) {
  return (lane - 1) * width * 1.65 + (moving ? Math.sin(time * .8 + lane * 1.7) * width * .42 : 0);
}
