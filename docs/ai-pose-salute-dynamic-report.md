# Chào: dynamic acquisition, hand evidence and latency

## Scope and audit

HEAD remained `5db8a5177f604ca2514a324af81a892e2567faa3`. Existing dirty changes were preserved; no other active agent was editing. No reset, stash, commit, push or deploy. No Survey, Exam, Shooting Range, 3D, API or Cloudflare edits for this task.

Before this task, Chào used a static final hold after a generic transition wait. Attention was already its precondition, but the raise itself was not retained/validated. Turn sequence/DTW code is specific to yaw and is not an appropriate salute trajectory rubric. It remains unchanged.

The project already contained Hand Landmarker, a 384×384 hand ROI in IMAGE mode, anatomical wrist matching, 21-point rendering and finger measurements/scoring. These are reused, not replaced. Existing finger rubric weights/bands and Nghiêm/Nghỉ scoring are unchanged. This does not certify those pre-existing finger bands as teacher-approved military standards.

Scheduler/runtime already prevented concurrent inference. Worker bitmap creation and worker timestamps are now additionally age-checked. Previously, drawing was triggered once per analysis result and used the existing smoothed snapshot; a separate RAF display loop now eases towards the most recent observation.

## Flow

Attention confirmed → countdown → CHÀO text/optional nonblocking speech → observed right-arm raise → final body pose acquired → stable window → three-second scored hold (extended only if a slow camera has not supplied the existing minimum sample count) → frozen result → THÔI → result.

`SaluteSequenceTracker` keeps bounded actual observations: wrist rise/velocity, elbow-angle evolution, head distance, path straightness ratio, command/first-motion/arrival times, stable duration and hand features. It requires at least two changing intermediate wrist observations after the command, not an exact reference path. Speed/path measurements do not contribute points. A jump directly to the final pose cannot manufacture movement evidence. Missing sequence evidence times out after 15 seconds with a not-scorable result, not a hand-pose error. Transition samples are excluded from final-pose scoring. Missing hand data does not block body acquisition.

Salute body scoring reads current detector observations after the existing confidence/outlier filters, not display interpolation. Other exercises retain their previous scoring path. Hand scoring accepts only a fresh hand inference from the exact body timestamp; a nearby cached sample may inform display/diagnostics within 100 ms, but cannot duplicate scoring evidence.

## Performance / display

- One in-flight inference; busy camera frames are skipped, never queued. On availability, the scheduler reads the current video frame. Skip ratio includes deliberate cadence throttling, not just errors.
- Worker rejects duplicate, backwards, nonfinite and over-200-ms-old inputs. Late captures and disposed/stale-attempt bitmaps are closed.
- Salute phases target waiting 10, countdown 12, transition up to 20, hold up to 15 FPS; FAST/NORMAL/LOW caps are 20/15/8. Measured cost can lower them further. Overload decreases quickly; increases need a stable five-second window. Switching back to other postures resets the salute-specific budget.
- RAF renderer runs at the browser's available display cadence, eases only towards latest observed coordinates, omits missing joints, clears stale skeletons and never supplies data to scoring. It cannot eliminate actual inference/camera latency or reconstruct unobserved motion.
- Hand inference only during salute transition/hold, only after the wrist reaches the upper-body/head region. Existing ROI is retained. Cadence decreases with measured Pose + Hand cost; no hand-frame queue.

For a camera session opened directly in Chào/Basic Drill, the hand model is prepared during the loading screen before inference starts, not in the middle of the raise. Changing into those exercises on an already running camera starts lazy preparation during setup; model loading is not finger inference. A failed hand-model load leaves body analysis available and the hand unassessed. Other exercises do not prepare the hand model. Stored results use version `v1.10-salute-dynamic` for auditability.

## Hand evidence

Separate features: availability, classification confidence, valid point count, age, identity consistency, four finger-extension values, spread/alignment, palm normal and wrist orientation. The existing scorer's metrics are retained.

Gates reject small/clipped/malformed hands, low classification confidence, unstable handedness labels, stale/future samples and weak ROI sharpness. SDK detection/presence confidence thresholds are retained. The pinned SDK does **not** expose per-finger confidence; classification score must not be described as per-joint certainty. ROI Laplacian variance is a conservative sharpness proxy, not perfect blur/occlusion detection; its practical behavior must be checked on real cameras. Rejected evidence remains `INSUFFICIENT_HAND_EVIDENCE`, with no finger mistake/deduction attributed to the user.

Handedness labels only check identity consistency. Anatomical Pose right-wrist proximity selects the saluting hand. Preview mirroring is a separate display transform and cannot invert scoring.

Local final UI separates attention precondition, observed transition, final body criteria and hand evidence. No camera/hand landmarks are added to persistent student result payloads.

## Verification and benchmark

New tests cover 5/8/12/20-FPS sequences, multiple raising speeds, standing ready in a salute pose, direct-final jumps, transition exclusion, stability, hand-only phase activation, ROI detector decimation, handedness flicker, small/clipped/blurred/low-confidence hands, timestamp mismatch, single-in-flight/latest-frame scheduling, adaptive hysteresis, display-copy isolation, bounded telemetry, finalization once and THÔI ordering. Existing Basic Drill, Nghiêm/Nghỉ, turns, storage/privacy tests remain included.

Final verification: `npm run test:pose` 274 passed / 0 failed; `npm run test:physics` 17 passed / 0 failed; `npm run lint` passed; `npm run build` passed (client and server). Existing CSS import-order / large-chunk warnings remain. `git diff --check` passed; HEAD unchanged.

`scripts/benchmark-pose-salute.ts` uses synthetic observed landmarks, 20 trials per 8/12/20 FPS. In one local run all 60 trials finalized once. SessionProcessor CPU median/p90 milliseconds: 8 FPS 0.213/0.430; 12 FPS 0.202/0.337; 20 FPS 0.205/0.345. The synthetic 1.8-second raise crossed the wrist-motion threshold at approximately 750 ms after the command; this is NOT webcam detection latency.

No real webcam, MediaPipe Pose/Hand inference, camera timestamp-to-display delay or actual browser render FPS benchmark was collected. Debug HUD provides live inference FPS, Pose/Hand cost, worker transit, app-frame landmark age, skipped frames, render cadence and rolling median/p90 (up to 120 samples). App-frame age starts when the browser scheduler samples video, not an independently verified sensor capture time.

## Real webcam checklist

1. Select Chào and enable `poseDebug=1` (or the diagnostic option). Begin at Attention, not with the hand raised.
2. Verify 3–2–1 → CHÀO; raise the right arm naturally, then hold. Look for COMMAND/TRANSITION, observed wrist rise, HAND_ACQUIRED when available, SCORING and FINALIZED. STABLE is a short internal acquisition boundary, not an additional user command.
3. Compare normal, quick and slow raises; verify transition is not graded as a final-pose mistake. Try a pre-raised hand: no countdown; try an unobserved jump: insufficient movement evidence, not a fabricated trajectory score.
4. Cover the hand / move too far away: body observations may remain valid while hand is unassessed. Verify the UI explains this without saying fingers are wrong.
5. Check mirrored preview, wrist-side matching, classification flicker, low-light sharpness behavior and warm/cold hand-model load.
6. On weak laptops, capture debug Pose/Hand median/p90, skips and landmark age. If inference exceeds the existing continuity limit or the raise falls between available frames, do not claim a reliable score; review the quality warning.

Stop here for the user's real-webcam test. No deployment performed.
