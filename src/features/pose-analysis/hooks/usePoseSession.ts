import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { AnalysisSnapshot, LightingMetrics, MovementId, PoseStage } from '../types';
import type { ScoreResult } from '../scoring/scoringTypes';
import type { SessionCommand } from '../runtime/workerProtocol';
import { POSE_CONFIG as C } from '../config';
import { lightingMetrics } from '../pipeline/qualityChecks';
import { createPoseRuntime, type PoseRuntime } from '../runtime/poseRuntime';
import { AdaptiveBudget, startFrameScheduler } from '../runtime/frameScheduler';
import { drawSkeleton, shouldDrawSkeleton } from '../rendering/skeletonRenderer';
import { startSkeletonRenderer } from '../rendering/visualSkeleton';
import { usePoseCamera } from './usePoseCamera';
import type { SequenceEngine } from '../scoring/sequenceEngine';
import { createPoseAttempt, freezeSnapshot, poseNowMs, type PoseAttemptContext, type PoseFinalAttempt } from '../runtime/attemptTiming';
import { COMMAND_OVERLAY_MS, STOP_OVERLAY_MS, type PoseCommandText } from '../runtime/commandFlow';
import { speakPoseCommand, cancelPoseSpeech, playCountdownBeep } from '../utils/audioFeedback';
import { RuntimePerformance } from '../diagnostics/runtimePerformance';

function getCommandForMovement(id: MovementId): SessionCommand {
  switch (id) {
    case 'atEase': return 'selectAtEase';
    case 'turnLeft': return 'selectTurnLeft';
    case 'turnRight': return 'selectTurnRight';
    case 'salute': return 'selectSalute';
    case 'basicDrill': return 'selectBasicDrill';
    case 'attention':
    default:
      return 'selectAttention';
  }
}

export function usePoseSession(options: {
  onAttemptStarted?: (attempt: Pick<PoseAttemptContext, 'id' | 'movementId' | 'startedAt'>) => void;
  onFinalResult?: (result: ScoreResult, attempt: PoseFinalAttempt) => void;
} = {}) {
  const camera = usePoseCamera(), canvasRef = useRef<HTMLCanvasElement>(null);
  const runtime = useRef<PoseRuntime | null>(null), abort = useRef<AbortController | null>(null), stopLoop = useRef<(() => void) | null>(null);
  const stopDisplay = useRef<(() => void) | null>(null);
  const startLoopRef = useRef<(() => void) | null>(null);
  const previousScoreRef = useRef<number | null>(null);
  const finishedResult = useRef<ScoreResult | null>(null);
  const activeAttemptRef = useRef<PoseAttemptContext | null>(null);
  const attemptStartedCallback = useRef(options.onAttemptStarted);
  attemptStartedCallback.current = options.onAttemptStarted;
  const finalResultCallback = useRef(options.onFinalResult);
  finalResultCallback.current = options.onFinalResult;
  const [activeAttempt, setActiveAttempt] = useState<PoseAttemptContext | null>(null);
  const [finalAttempt, setFinalAttempt] = useState<PoseFinalAttempt | null>(null);
  const allocateAttempt = useCallback((id: MovementId) => {
    const attempt = createPoseAttempt(id);
    activeAttemptRef.current = attempt;
    setActiveAttempt(attempt); setFinalAttempt(null);
    attemptStartedCallback.current?.(attempt);
    return attempt;
  }, []);
  const [scoreComparison, setScoreComparison] = useState<{ previous: number; delta: number } | null>(null);
  const latest = useRef<AnalysisSnapshot | null>(null), mounted = useRef(true);
  const [stage, setStage] = useState<PoseStage>('idle'), [snapshot, setSnapshot] = useState<AnalysisSnapshot | null>(null);
  const [result, setResult] = useState<ScoreResult | null>(null), [error, setError] = useState(''), [mode, setMode] = useState('');
  const [sequenceEngine, setSequenceEngine] = useState<'loading' | SequenceEngine['kind']>('loading');
  const [facing, setFacing] = useState<'user' | 'environment'>('user'), [preferGpu, setPreferGpu] = useState(false), [reduced, setReduced] = useState(false);
  const [movementId, setMovementId] = useState<MovementId>('attention');
  const [muted, setMuted] = useState(false), mutedRef = useRef(false); mutedRef.current = muted;
  const [scorePrecondition, setScorePrecondition] = useState(false);
  const [commandCue, setCommandCue] = useState<{ command: PoseCommandText; timestampMs: number; attemptId?: string } | null>(null);
  const presentationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTick = useRef('');
  const clearPresentation = useCallback(() => {
    if (presentationTimer.current) clearTimeout(presentationTimer.current);
    presentationTimer.current = null; setCommandCue(null); cancelPoseSpeech();
    countdownTick.current = '';
  }, []);
  useEffect(() => { if (muted) cancelPoseSpeech(); }, [muted]);

  const release = useCallback(() => {
    clearPresentation();
    abort.current?.abort(); abort.current = null; stopLoop.current?.(); stopLoop.current = null;
    startLoopRef.current = null;
    stopDisplay.current?.(); stopDisplay.current = null;
    runtime.current?.dispose(); runtime.current = null; camera.stop();
    latest.current = null; if (canvasRef.current) drawSkeleton(canvasRef.current, null);
  }, [camera.stop, clearPresentation]);

  const stop = useCallback(() => {
    finishedResult.current = null;
    activeAttemptRef.current = null;
    release();
    if (mounted.current) { setActiveAttempt(null); setFinalAttempt(null); setStage('idle'); setSnapshot(null); setResult(null); setError(''); setSequenceEngine('loading'); }
  }, [release]);

  const resetStudentSession = useCallback(() => {
    stop(); previousScoreRef.current = null; setScoreComparison(null);
  }, [stop]);

  const fail = useCallback((message: string) => {
    release();
    if (mounted.current && !finishedResult.current) { setStage('error'); setError(message); setSnapshot(null); setResult(null); }
  }, [release]);

  useEffect(() => {
    mounted.current = true;
    // Release the camera when leaving the tab, but keep a completed assessment.
    const suspend = () => {
      if (finishedResult.current) { release(); setSnapshot(null); setStage(finishedResult.current.status === 'scored' ? 'result' : 'blocked'); }
      else stop();
    };
    const hidden = () => { if (document.hidden) suspend(); };
    const pagehide = () => suspend();
    document.addEventListener('visibilitychange', hidden); window.addEventListener('pagehide', pagehide);
    return () => { mounted.current = false; document.removeEventListener('visibilitychange', hidden); window.removeEventListener('pagehide', pagehide); release(); };
  }, [release, stop]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      const snapshot = latest.current;
      drawSkeleton(canvas, snapshot && shouldDrawSkeleton(snapshot.frame) ? snapshot.frame : null);
    }); observer.observe(canvas);
    return () => observer.disconnect();
  }, [stage]);

  const startRuntime = async (attempt: PoseAttemptContext) => {
    finishedResult.current = null;
    release(); setResult(null); setSnapshot(null); setError(''); setReduced(false); setSequenceEngine('loading');
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || typeof WebAssembly === 'undefined') {
      setStage('unsupported'); setError('Cần trình duyệt hỗ trợ WebAssembly, camera và kết nối HTTPS (hoặc localhost).'); return;
    }
    const controller = new AbortController(); abort.current = controller; setStage('loading-model');
    try {
      const video = await camera.start(facing, () => { if (!controller.signal.aborted) fail('Camera đã bị ngắt kết nối.'); });
      if (controller.signal.aborted) return;
      let budget = new AdaptiveBudget(), lastUi = 0, lastStage: PoseStage = 'quality-check';
      let scheduleStats = { submitted: 0, dropped: 0, droppedRatio: 0 }, renderFps = 0, displayAge: number | undefined;
      const measurements = new RuntimePerformance();
      const engine = await createPoseRuntime(controller.signal, event => {
        if (controller.signal.aborted || !mounted.current) return;
        if ((event.type === 'score' || event.type === 'analysis' || event.type === 'commandCue') && event.attemptId !== activeAttemptRef.current?.id) return;
        if (event.type === 'commandCue') {
          if (finishedResult.current) return;
          if (presentationTimer.current) clearTimeout(presentationTimer.current);
          setCommandCue(event); speakPoseCommand(event.command, mutedRef.current);
          if (event.command === 'THÔI') setStage('stop-command');
          else presentationTimer.current = setTimeout(() => setCommandCue(null), COMMAND_OVERLAY_MS);
          return;
        }
        if (event.type === 'error') { fail(event.message); return; }
        if (event.type === 'score') {
          if (finishedResult.current || !event.timing || !activeAttemptRef.current) return;
          const receivedAtMs = poseNowMs();
          const timing = { ...event.timing, uiReceivedAtMs: receivedAtMs,
            processingLatencyMs: Math.max(0, receivedAtMs - (event.timing.scoringWindowFinishedAtMs ?? event.timing.resultFinalizedAtMs)) };
          const currentAttempt = activeAttemptRef.current;
          const final = freezeSnapshot({ id: currentAttempt.id, movementId: currentAttempt.movementId,
            startedAt: currentAttempt.startedAt, finishedAt: new Date(event.timing.resultFinalizedAtMs).toISOString(), timing });
          const frozenResult = freezeSnapshot(event.result);
          finishedResult.current = frozenResult;
          setFinalAttempt(final); setResult(frozenResult);
          // Xóa skeleton overlay trên canvas khi hoàn tất
          if (canvasRef.current) drawSkeleton(canvasRef.current, null);
          // Dừng ngay scheduler loop để không tốn CPU/GPU trong lúc học sinh đọc kết quả
          stopLoop.current?.(); stopLoop.current = null;
          stopDisplay.current?.(); stopDisplay.current = null;
          // Queue persistence independently of dialog presentation; never await it.
          try { finalResultCallback.current?.(frozenResult, final); }
          catch { /* A consumer's save preparation must not discard the assessment. */ }

          if (event.result.status === 'scored') {
            // So sánh kết quả trong cùng phiên (session-only)
            if (event.result.assessment !== 'incomplete' && previousScoreRef.current !== null) {
              setScoreComparison({
                previous: previousScoreRef.current,
                delta: event.result.total - previousScoreRef.current,
              });
            } else {
              setScoreComparison(null);
            }
            if (event.result.assessment !== 'incomplete') previousScoreRef.current = event.result.total;

          }
          // One short presentation boundary. Saving/audio are never awaited.
          setStage('stop-command');
          const resultId = currentAttempt.id;
          presentationTimer.current = setTimeout(() => {
            if (mounted.current && activeAttemptRef.current?.id === resultId && finishedResult.current === frozenResult) {
              setCommandCue(null); setStage(frozenResult.status === 'scored' ? 'result' : 'blocked');
            }
          }, STOP_OVERLAY_MS);
        }
        // The worker sends a final analysis after score; it must not overwrite
        // the result stage or redraw the skeleton after the scheduler stops.
        if (event.type === 'analysis' && !finishedResult.current) {
          if (event.snapshot.stage === 'countdown' && event.snapshot.quality.passed) {
            const key = `${event.snapshot.drillProgress?.index ?? 0}:${Math.max(1, Math.ceil(3 * (1 - event.snapshot.progress)))}`;
            if (key !== countdownTick.current) { countdownTick.current = key; playCountdownBeep(750, .08, mutedRef.current); }
          } else countdownTick.current = '';
          budget.setPhase(event.snapshot.stage, event.snapshot.drillProgress?.movementId ?? activeAttemptRef.current?.movementId ?? 'attention');
          budget.observe(event.snapshot.inferenceMs + (event.snapshot.performance?.workerLatencyMs ?? 0));
          measurements.observe(event.snapshot.performance ?? {});
          event.snapshot.performance = { ...event.snapshot.performance, droppedFrames: scheduleStats.dropped,
            droppedFrameRatio: scheduleStats.droppedRatio, submittedFrames: scheduleStats.submitted,
            renderFps, profile: budget.profile, targetFps: budget.fps,
            benchmark: measurements.summary() };
          latest.current = event.snapshot;
          if (budget.fps < C.targetFps) setReduced(true);
          if (performance.now() - lastUi >= C.uiIntervalMs || event.snapshot.stage !== lastStage) {
            lastUi = performance.now(); lastStage = event.snapshot.stage; setSnapshot(event.snapshot); setStage(event.snapshot.stage);
          }
        }
      }, preferGpu, attempt.movementId === 'salute' || attempt.movementId === 'basicDrill');
      if (controller.signal.aborted) { engine.dispose(); return; }
      runtime.current = engine;
      const currentAttempt = activeAttemptRef.current ?? attempt;
      engine.command('reset', currentAttempt);
      if (currentAttempt.movementId !== 'attention') engine.command(getCommandForMovement(currentAttempt.movementId), currentAttempt);
      engine.command(scorePrecondition ? 'enablePreconditionScoring' : 'disablePreconditionScoring');
      budget = new AdaptiveBudget(engine.fallback); setMode(engine.mode); setReduced(engine.fallback); setSequenceEngine(engine.sequenceEngine); setStage('quality-check');
      const lightingCanvas = document.createElement('canvas'); lightingCanvas.width = 64; lightingCanvas.height = 48;
      const ctx = lightingCanvas.getContext('2d', { willReadFrequently: true }); if (!ctx) throw new Error('Trình duyệt không hỗ trợ Canvas 2D.');

      const runScheduler = () => {
        stopLoop.current?.();
        stopDisplay.current?.();
        if (canvasRef.current) stopDisplay.current = startSkeletonRenderer(canvasRef.current,
          () => finishedResult.current ? null : latest.current?.frame ?? null,
          (fps, age) => { renderFps = fps; displayAge = age; });
        let lighting: LightingMetrics = { mean: 0, darkRatio: 1, brightRatio: 0 }, lastLighting = -Infinity;
        stopLoop.current = startFrameScheduler(video, budget, async timestamp => {
          if (controller.signal.aborted) return;
          if (timestamp - lastLighting >= 500) { ctx.drawImage(video, 0, 0, 64, 48); lighting = lightingMetrics(ctx.getImageData(0, 0, 64, 48).data); lastLighting = timestamp; }
          await engine.analyze(video, timestamp, lighting);
        }, message => { if (!controller.signal.aborted) fail(message); }, stats => { scheduleStats = stats; });
      };

      startLoopRef.current = runScheduler;
      runScheduler();
    } catch (e) {
      if (!controller.signal.aborted) {
        const name = e instanceof DOMException ? e.name : '';
        const messages: Record<string, string> = { NotAllowedError: 'Quyền camera bị từ chối. Cho phép camera trong cài đặt trình duyệt rồi thử lại.', NotFoundError: 'Không tìm thấy camera trên thiết bị.', NotReadableError: 'Camera đang bận hoặc không truy cập được. Đóng ứng dụng đang dùng camera rồi thử lại.', OverconstrainedError: 'Camera không hỗ trợ cấu hình yêu cầu.' };
        fail(messages[name] || (e instanceof Error ? e.message : 'Không khởi tạo được camera hoặc mô hình.'));
      }
    }
  };

  const start = () => startRuntime(allocateAttempt(movementId));

  const calibrate = useCallback(() => {
    if (latest.current?.quality.passed && runtime.current) {
      const attempt = finishedResult.current ? allocateAttempt(movementId)
        : activeAttemptRef.current ?? allocateAttempt(movementId);
      finishedResult.current = null;
      setResult(null);
      setStage('calibrating');
      runtime.current.command(scorePrecondition ? 'enablePreconditionScoring' : 'disablePreconditionScoring');
      runtime.current.command('startCalibration', attempt);
      if (!stopLoop.current && startLoopRef.current) {
        startLoopRef.current();
      }
    }
  }, [allocateAttempt, movementId, scorePrecondition]);

  const retry = useCallback(() => {
    if (!mounted.current) return;
    finishedResult.current = null;
    clearPresentation();
    setResult(null);
    setSnapshot(null); latest.current = null;
    setError('');
    const attempt = allocateAttempt(movementId);
    const video = camera.videoRef.current;
    const engine = runtime.current;
    if (video && engine && !abort.current?.signal.aborted && startLoopRef.current) {
      engine.command('reset', attempt);
      if (movementId !== 'attention') engine.command(getCommandForMovement(movementId), attempt);
      engine.command(scorePrecondition ? 'enablePreconditionScoring' : 'disablePreconditionScoring');
      setStage('quality-check');
      startLoopRef.current();
    } else {
      void startRuntime(attempt);
    }
  }, [camera.videoRef, movementId, allocateAttempt, clearPresentation, scorePrecondition]);

  const changeMovement = useCallback((id: MovementId) => {
    clearPresentation();
    finishedResult.current = null;
    setMovementId(id);
    setResult(null);
    setSnapshot(null); latest.current = null;
    previousScoreRef.current = null;
    setScoreComparison(null);
    const attempt = allocateAttempt(id);
    const engine = runtime.current;
    if (engine) {
      engine.command('reset', attempt);
      engine.command(getCommandForMovement(id), attempt);
      setStage('quality-check');
      startLoopRef.current?.();
    } else setStage('idle');
  }, [allocateAttempt, clearPresentation]);

  const changeCamera = () => { stop(); setFacing(value => value === 'user' ? 'environment' : 'user'); };

  return {
    videoRef: camera.videoRef,
    canvasRef,
    stage,
    snapshot,
    result,
    attemptId: activeAttempt?.id ?? null,
    activeAttempt,
    finalAttempt,
    scoreComparison,
    movementId,
    changeMovement,
    error,
    mode,
    sequenceEngine,
    reduced,
    facing,
    preferGpu,
    setPreferGpu,
    start,
    stop,
    resetStudentSession,
    calibrate,
    retry,
    changeCamera,
    commandCue, muted, setMuted, scorePrecondition, setScorePrecondition,
  };
}
