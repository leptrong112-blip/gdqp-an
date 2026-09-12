# AI Pose Analysis V1

## Feature boundary

`src/features/pose-analysis` is loaded through the portal's `pose` tab. The page owns its camera, worker, model and session. MediaPipe is declared directly at **0.10.17**. No portal account, API, localStorage or XP integration is involved. Results are held in React state and discarded on navigation or restart.

The production worker is deliberately classic: the pinned MediaPipe WASM loader uses `importScripts`. In Vite development environments where classic TypeScript workers cannot run, initialization falls back to main-thread CPU at 10 FPS. Production builds emit a self-contained worker. Optional GPU initialization falls back to CPU if unsupported. Normal startup uses CPU.

## Data flow and quality

Camera → MediaPipe adapter → raw confidence/quality gate → smoothing → body normalization → feature extraction → scoring → throttled React view and imperative canvas.

Internal image x coordinates use image-height units, not pixels. Display rendering divides by the aspect ratio through a contain transform. World coordinates are separately centered at hip midpoint and normalized by calibrated world shoulder width. Image and world units are never mixed.

SDK 0.10.17 exposes `visibility` but does not expose landmark `presence` through its JavaScript result types. The adapter preserves presence if a runtime provides it, otherwise records `null`. Pose presence is gated using `minPosePresenceConfidence: 0.5`; missing per-landmark presence is never fabricated as 1.0. Image confidence and current required landmarks gate scoring; smoothed/cached points are only visual continuity and never used to pass the raw gate.

Quality failures stop accumulation immediately. Recovery requires a continuous second of passing raw checks. A raw failure lasting over 500 ms or a frame gap over 250 ms aborts the attempt. Short failures pause the attempt and exclude bad frames; they are not scored. Calibration requires two consecutive valid seconds. A three-second countdown precedes a three-second valid hold.

Lighting, full-body framing, person count, front-facing orientation, required joint reliability, and static root/scale stability all gate scoring. The static stability test intentionally rejects either camera movement or subject movement for this exercise. It does not estimate independent camera motion. Foot opening is an approximate 2D projection and needs frontal camera placement; finger placement and precise gaze are not measured. Rubric tolerances are beta training defaults, not validated formal grades.

## Assets

- WASM files in `public/mediapipe/wasm` are copied byte-for-byte from the installed `@mediapipe/tasks-vision@0.10.17/wasm` package (Apache-2.0 package).
- Model: `public/models/pose/pose_landmarker_lite.task`, official float16 revision 1, downloaded from `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`.
- The runtime, model and fallback CPU/GPU processing stay on the local device. Only same-origin static assets are fetched; no webcam frames or landmarks are sent over HTTP.
- Keep the package and all WASM files in sync. Both SIMD and non-SIMD variants are included; only the selected variant is fetched at runtime. The model is about 5.8 MB and each WASM variant about 9.5 MB before transfer compression.

## Verification

Run `npm run test:pose`, `npm run lint`, and `npm run build`.

For a browser-level model/worker check without camera permission:

1. Build the project and run the existing development server.
2. Find the generated `dist/assets/pose.worker-*.js` filename.
3. Open `/scripts/pose-browser-smoke.html?worker=/dist/assets/<generated-worker-filename>`.
4. Run CPU and optional GPU tests. Expect initialization, blank-frame rejection, and disposal acknowledgement. The fixture is outside `public` and is not included in the production website.

Automated coverage includes geometry, scale/translation/mirror invariance, confidence filtering, smoothing expiry, calibration rejection, quality gates, full session transitions, weighted scoring/refusal and worker cancellation. Browser smoke coverage verifies actual self-hosted WASM/model initialization and inference on a synthetic blank image. It does not validate accuracy on real people.

Before presenting this as a graded exercise, validate teacher-approved correct/incorrect examples across physiques, clothing, lighting and front-camera placement. Physical Android/iOS camera switching, sustained thermal performance and full-body scoring require real-device validation; viewport simulation does not establish those capabilities.
