import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { AnalysisSnapshot, LightingMetrics, MovementId, PoseStage } from '../types';
import type { ScoreResult } from '../scoring/scoringTypes';
import type { SessionCommand } from '../runtime/workerProtocol';
import { POSE_CONFIG as C } from '../config';
import { lightingMetrics } from '../pipeline/qualityChecks';
import { createPoseRuntime, type PoseRuntime } from '../runtime/poseRuntime';
import { AdaptiveBudget, startFrameScheduler } from '../runtime/frameScheduler';
import { drawSkeleton, shouldDrawSkeleton } from '../rendering/skeletonRenderer';
import { usePoseCamera } from './usePoseCamera';
import type { SequenceEngine } from '../scoring/sequenceEngine';

function getCommandForMovement(id: MovementId): SessionCommand {
  switch (id) {
    case 'atEase': return 'selectAtEase';
    case 'turnLeft': return 'selectTurnLeft';
    case 'turnRight': return 'selectTurnRight';
    case 'salute': return 'selectSalute';
    case 'attention':
    default:
      return 'selectAttention';
  }
}

export function usePoseSession() {
  const camera = usePoseCamera(), canvasRef = useRef<HTMLCanvasElement>(null);
  const runtime = useRef<PoseRuntime | null>(null), abort = useRef<AbortController | null>(null), stopLoop = useRef<(() => void) | null>(null);
  const startLoopRef = useRef<(() => void) | null>(null);
  const previousScoreRef = useRef<number | null>(null);
  const finishedResult = useRef<ScoreResult | null>(null);
  const [scoreComparison, setScoreComparison] = useState<{ previous: number; delta: number } | null>(null);
  const latest = useRef<AnalysisSnapshot | null>(null), mounted = useRef(true);
  const [stage, setStage] = useState<PoseStage>('idle'), [snapshot, setSnapshot] = useState<AnalysisSnapshot | null>(null);
  const [result, setResult] = useState<ScoreResult | null>(null), [error, setError] = useState(''), [mode, setMode] = useState('');
  const [sequenceEngine, setSequenceEngine] = useState<'loading' | SequenceEngine['kind']>('loading');
  const [facing, setFacing] = useState<'user' | 'environment'>('user'), [preferGpu, setPreferGpu] = useState(false), [reduced, setReduced] = useState(false);
  const [movementId, setMovementId] = useState<MovementId>('attention');

  const release = useCallback(() => {
    abort.current?.abort(); abort.current = null; stopLoop.current?.(); stopLoop.current = null;
    startLoopRef.current = null;
    runtime.current?.dispose(); runtime.current = null; camera.stop();
    latest.current = null; if (canvasRef.current) drawSkeleton(canvasRef.current, null);
  }, [camera.stop]);

  const stop = useCallback(() => {
    finishedResult.current = null;
    release();
    if (mounted.current) { setStage('idle'); setSnapshot(null); setResult(null); setError(''); setSequenceEngine('loading'); }
  }, [release]);

  const fail = useCallback((message: string) => {
    release();
    if (mounted.current && !finishedResult.current) { setStage('error'); setError(message); setSnapshot(null); setResult(null); }
  }, [release]);

  useEffect(() => {
    mounted.current = true;
    // Release the camera when leaving the tab, but keep a completed assessment.
    const suspend = () => {
      if (finishedResult.current) { release(); setSnapshot(null); }
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
  }, []);

  const start = async () => {
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
      const engine = await createPoseRuntime(controller.signal, event => {
        if (controller.signal.aborted || !mounted.current) return;
        if (event.type === 'error') { fail(event.message); return; }
        if (event.type === 'score') {
          finishedResult.current = event.result;
          setResult(event.result);
          // Xóa skeleton overlay trên canvas khi hoàn tất
          if (canvasRef.current) drawSkeleton(canvasRef.current, null);
          // Dừng ngay scheduler loop để không tốn CPU/GPU trong lúc học sinh đọc kết quả
          stopLoop.current?.(); stopLoop.current = null;

          if (event.result.status === 'scored') {
            // So sánh kết quả trong cùng phiên (session-only)
            if (previousScoreRef.current !== null) {
              setScoreComparison({
                previous: previousScoreRef.current,
                delta: event.result.total - previousScoreRef.current,
              });
            } else {
              setScoreComparison(null);
            }
            previousScoreRef.current = event.result.total;

            setStage('result');
          } else {
            setStage('blocked');
          }
        }
        // The worker sends a final analysis after score; it must not overwrite
        // the result stage or redraw the skeleton after the scheduler stops.
        if (event.type === 'analysis' && !finishedResult.current) {
          latest.current = event.snapshot; budget.observe(event.snapshot.inferenceMs);
          if (budget.fps < C.targetFps) setReduced(true);
          if (canvasRef.current) drawSkeleton(canvasRef.current, shouldDrawSkeleton(event.snapshot.frame) ? event.snapshot.frame : null);
          if (performance.now() - lastUi >= C.uiIntervalMs || event.snapshot.stage !== lastStage) {
            lastUi = performance.now(); lastStage = event.snapshot.stage; setSnapshot(event.snapshot); setStage(event.snapshot.stage);
          }
        }
      }, preferGpu);
      if (controller.signal.aborted) { engine.dispose(); return; }
      runtime.current = engine;
      if (movementId !== 'attention') engine.command(getCommandForMovement(movementId));
      budget = new AdaptiveBudget(engine.fallback); setMode(engine.mode); setReduced(engine.fallback); setSequenceEngine(engine.sequenceEngine); setStage('quality-check');
      const lightingCanvas = document.createElement('canvas'); lightingCanvas.width = 64; lightingCanvas.height = 48;
      const ctx = lightingCanvas.getContext('2d', { willReadFrequently: true }); if (!ctx) throw new Error('Trình duyệt không hỗ trợ Canvas 2D.');

      const runScheduler = () => {
        stopLoop.current?.();
        let lighting: LightingMetrics = { mean: 0, darkRatio: 1, brightRatio: 0 }, lastLighting = -Infinity;
        stopLoop.current = startFrameScheduler(video, budget, async timestamp => {
          if (controller.signal.aborted) return;
          if (timestamp - lastLighting >= 500) { ctx.drawImage(video, 0, 0, 64, 48); lighting = lightingMetrics(ctx.getImageData(0, 0, 64, 48).data); lastLighting = timestamp; }
          await engine.analyze(video, timestamp, lighting);
        }, message => { if (!controller.signal.aborted) fail(message); });
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

  const calibrate = useCallback(() => {
    if (latest.current?.quality.passed && runtime.current) {
      finishedResult.current = null;
      setResult(null);
      setStage('calibrating');
      runtime.current.command('startCalibration');
      if (!stopLoop.current && startLoopRef.current) {
        startLoopRef.current();
      }
    }
  }, []);

  const retry = useCallback(() => {
    if (!mounted.current) return;
    finishedResult.current = null;
    setResult(null);
    setError('');
    const video = camera.videoRef.current;
    const engine = runtime.current;
    if (video && engine && !abort.current?.signal.aborted && startLoopRef.current) {
      engine.command('reset');
      if (movementId !== 'attention') engine.command(getCommandForMovement(movementId));
      setStage('quality-check');
      startLoopRef.current();
    } else {
      void start();
    }
  }, [camera.videoRef, movementId]);

  const changeMovement = useCallback((id: MovementId) => {
    finishedResult.current = null;
    setMovementId(id);
    setResult(null);
    previousScoreRef.current = null;
    setScoreComparison(null);
    const engine = runtime.current;
    if (engine) {
      engine.command('reset');
      engine.command(getCommandForMovement(id));
      setStage('quality-check');
      startLoopRef.current?.();
    } else setStage('idle');
  }, []);

  const changeCamera = () => { stop(); setFacing(value => value === 'user' ? 'environment' : 'user'); };

  return {
    videoRef: camera.videoRef,
    canvasRef,
    stage,
    snapshot,
    result,
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
    calibrate,
    retry,
    changeCamera,
  };
}
