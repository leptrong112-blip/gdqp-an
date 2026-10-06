# AI Pose latency audit — 2026-10-04

## Phase 1: measured before implementation

The actual path is camera frame → adaptive scheduler → ImageBitmap/worker (or main-thread fallback) → MediaPipe → SessionProcessor → synchronous scoring → score message → React state → result dialog. The existing score event already bypassed the 200 ms live-analysis UI throttle. No extra post-hold timeout, result animation wait, model warmup or API save was found in that path.

The visible preparation can still be long: quality warmup, the page's automatic calibration countdown, 2 s calibration, 3 s movement countdown and the required 3 s static hold. Quality/stability losses restart valid hold collection; wrong-direction turns can run to the existing 8 s motion timeout. These periods are evidence collection, not post-completion scoring latency. Rubric, confidence thresholds, model and required holds are unchanged.

Before any edits, Node fixtures drove 40 complete attention attempts per interval. The measured number below is the CPU duration of the final `SessionProcessor.process` call, including final feature extraction and scoring. It excludes MediaPipe inference, real worker transport and React rendering.

| Source frame interval | BEFORE final-frame CPU median / max | AFTER final-frame CPU median / max | Hold boundary → qualifying source frame |
| --- | --- | --- | --- |
| 67 ms | 0.240 / 1.190 ms | 0.351 / 1.760 ms | 15 ms |
| 100 ms | 0.180 / 0.317 ms | 0.265 / 0.907 ms | 0 ms |
| 125 ms | 0.174 / 0.406 ms | 0.219 / 0.545 ms | 0 ms |

Additional BEFORE fixture measurements: left turn 0.353 ms median / 2.468 ms max; right turn 0.262 / 0.474 ms; Basic Drill 0.227 / 1.563 ms. Forty attempts yielded exactly forty final-score events in each case. These measurements show no CPU scoring bottleneck. Deep snapshot cloning/freezing adds a small cost; it is not reported as a speed improvement.

Feeding twenty frames after completion in each attention attempt previously produced 800 unnecessary analysis events per interval group; it now produces zero. Before and after, required source-frame sampling is identical.

Reproduce the AFTER CPU measurement:

```powershell
node --require ./scripts/tests/tsx-windows-preload.cjs --import tsx scripts/benchmark-pose-finalization.ts
```

The BEFORE measurements were taken with the same fixture, forty-trial loop and intervals before adding guards/freezing. The working tree contained prior user changes; no reset or checkout was used to rerun a different version.

## Instrumentation and finalization

`runtime/attemptTiming.ts` defines epoch-based monotonic timestamps (`performance.timeOrigin + performance.now`) for comparable worker/main-thread clocks:

- T0 `attemptStartedAtMs`: attempt allocation; identity binds synchronously to this ID.
- T1 `qualityReadyAtMs`: first accepted quality frame.
- T2 `countdownFinishedAtMs`: first movement start cue.
- T3 `scoringWindowFinishedAtMs`: exact valid static-hold boundary, excluding final-frame sampling overshoot; for turns, the source timestamp of the first sufficient final-hold frame.
- T4 `finalFrameProcessedAtMs`: required final frame features/tracker have been processed; finalization begins.
- T5 `resultFinalizedAtMs`: evaluate and deep immutable snapshot finished.
- T6 `uiReceivedAtMs`: hook receives the score, before result render or async save.
- T7 is a browser DOM/presentation marker from `requestAnimationFrame` after `showModal`, measured separately by the dialog callback; it never mutates the frozen core result. It is not a measurement of the physical screen paint.

`inferenceMs` is detector CPU time for the final needed frame. `finalizationMs` is T4→T5. `workerLatencyMs` sums main→worker dispatch/queue and worker→main final-score delivery; it does not include inference or finalization. `processingLatencyMs` in the hook is T3→T6. The result/storage UI may record T3→T7 once the dialog has presented.

Completion now freezes scoring evidence and snapshots each Basic Drill step, finalizes once, sends the score immediately, and stops scheduler/detector work. Late frames are ignored. One inexpensive terminal analysis snapshot preserves existing diagnostics/tests; it does not recompute features. A final score itself settles the pending worker-frame promise. Capture/worker messages carry the attempt ID so retry cannot attach an old frame or score to the next student/attempt.

## Evidence limits

Actual BEFORE T3→T7: **not measured**. Actual AFTER T3→T7: **not measured in this audit**. The required instrumentation is now available for real-browser/webcam runs. The synthetic sub-millisecond CPU figures are not webcam benchmarks and do not establish a ≤1 s result-display guarantee.

The save queue starts independently of the dialog lifetime. It accepts one presentation marker before submission, or starts after a 100 ms fallback with a null rendered latency. This fallback does not block result rendering and never invents a zero latency when the browser cannot supply T7.

Focused tests cover synchronous first-sufficient-frame emission, exact static boundary timestamps, deep immutable scores and drill steps, zero late-frame analysis, retry IDs/reset, pending bitmap invalidation, stale score rejection and pending promise completion without an extra analysis event.
