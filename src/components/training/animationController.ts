import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { AnimationAction, AnimationMixer, LoopOnce, LoopRepeat } from 'three';

export const SOLDIER_ANIMATIONS = [
  'Idle', 'Attention', 'AtEase', 'Salute', 'Walk', 'Run',
  'SitDown', 'StandUp', 'TurnLeft', 'TurnRight', 'LookAround',
] as const;

export type SoldierAnimationName = typeof SOLDIER_ANIMATIONS[number];

const LOOPING_ANIMATIONS = new Set<SoldierAnimationName>([
  'Idle', 'AtEase', 'Walk', 'Run', 'LookAround',
]);

/** One-shot actions retain their last pose until the next command. */
export function getAnimationPlaybackMode(name: SoldierAnimationName) {
  const repeating = LOOPING_ANIMATIONS.has(name);
  return {
    loop: repeating ? LoopRepeat : LoopOnce,
    repetitions: repeating ? Infinity : 1,
    clampWhenFinished: !repeating,
  };
}

interface AnimationControllerOptions {
  actions: Record<string, AnimationAction | null>;
  mixer: AnimationMixer;
  animation: SoldierAnimationName;
  paused?: boolean;
  playbackSpeed?: number;
  resetSignal?: number;
  fadeDuration?: number;
}

interface FadeEntry {
  action: AnimationAction;
  from: number;
  to: number;
}

/**
 * All state belongs to one cloned soldier's mixer. Explicit blend weights let a
 * new command start from the currently visible blend, including rapid clicks.
 * No timers or delayed callbacks can revive an obsolete action.
 */
export class SoldierAnimationPlayback {
  private active: AnimationAction | null = null;
  private playing = new Set<AnimationAction>();
  private fade: { elapsed: number; duration: number; entries: FadeEntry[] } | null = null;

  constructor(
    private actions: Record<string, AnimationAction | null>,
    private mixer: AnimationMixer,
  ) {}

  setPlayback(paused: boolean, playbackSpeed: number) {
    const speed = Number.isFinite(playbackSpeed) ? Math.max(0.1, Math.min(playbackSpeed, 3)) : 1;
    // Pause the mixer, preserving both a partial action and clamped end poses.
    this.mixer.timeScale = paused ? 0 : speed;
  }

  select(animation: SoldierAnimationName, fadeDuration = 0.25) {
    const selected = this.actions[animation];
    const next = selected ?? this.actions.Idle;
    if (!next) return;

    const mode = getAnimationPlaybackMode(selected ? animation : 'Idle');
    const previousWeight = this.playing.has(next) ? next.getEffectiveWeight() : 0;
    for (const action of this.playing) action.stopFading().stopWarping();

    next.reset();
    next.enabled = true;
    next.clampWhenFinished = mode.clampWhenFinished;
    next.setLoop(mode.loop, mode.repetitions);
    next.setEffectiveTimeScale(1);
    next.setEffectiveWeight(previousWeight);
    next.play();
    this.playing.add(next);

    const duration = Number.isFinite(fadeDuration) ? Math.max(0, fadeDuration) : 0.25;
    if (!this.active || duration === 0) {
      for (const action of this.playing) {
        if (action !== next) action.stop();
      }
      this.playing = new Set([next]);
      next.setEffectiveWeight(1);
      this.fade = null;
    } else {
      this.fade = {
        elapsed: 0,
        duration,
        entries: [...this.playing].map((action) => ({
          action,
          from: action.getEffectiveWeight(),
          to: action === next ? 1 : 0,
        })),
      };
    }
    this.active = next;
    // Evaluate t=0 immediately, including commands issued while paused.
    this.mixer.update(0);
  }

  update(delta: number) {
    const transition = this.fade;
    if (!transition || this.mixer.timeScale === 0) return;
    transition.elapsed += Math.min(delta, 0.1) * this.mixer.timeScale;
    const progress = Math.min(transition.elapsed / transition.duration, 1);
    const eased = progress * progress * (3 - 2 * progress);
    for (const entry of transition.entries) {
      entry.action.setEffectiveWeight(entry.from + (entry.to - entry.from) * eased);
      if (progress === 1 && entry.to === 0) {
        entry.action.stop();
        this.playing.delete(entry.action);
      }
    }
    if (progress === 1) this.fade = null;
  }

  dispose() {
    this.fade = null;
    this.active = null;
    this.playing.clear();
    this.mixer.stopAllAction();
  }
}

export function useSoldierAnimationController({
  actions,
  mixer,
  animation,
  paused = false,
  playbackSpeed = 1,
  resetSignal = 0,
  fadeDuration = 0.25,
}: AnimationControllerOptions) {
  const controller = useMemo(() => new SoldierAnimationPlayback(actions, mixer), [actions, mixer]);
  useEffect(() => { controller.setPlayback(paused, playbackSpeed); }, [controller, paused, playbackSpeed]);
  useEffect(() => { controller.select(animation, fadeDuration); }, [controller, animation, resetSignal, fadeDuration]);
  // Update blend weights before drei advances the mixer at frame priority 0.
  useFrame((_, delta) => { controller.update(delta); }, -0.25);
  useEffect(() => () => { controller.dispose(); }, [controller]);
}
