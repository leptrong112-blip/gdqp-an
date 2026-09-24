# AI Pose Analysis V1

## Feature boundary

`src/features/pose-analysis` is loaded through the portal's `pose` tab. The page owns its camera, worker, model and session. MediaPipe is declared directly at **0.10.17**. No portal account, API, localStorage or XP integration is involved. Results are held in React state and discarded on navigation or restart.

The production worker is deliberately classic: the pinned MediaPipe WASM loader uses `importScripts`. In Vite development environments where classic TypeScript workers cannot run, initialization falls back to main-thread CPU at 10 FPS. Production builds emit a self-contained worker. Optional GPU initialization falls back to CPU if unsupported. Normal startup uses CPU.

## Data flow and quality

Camera → MediaPipe adapter → confidence filter → temporal/3D bone outlier filter → quality gate → smoothing → body normalization → feature extraction → scoring → throttled React view and imperative canvas.

Image x/y coordinates stay normalized to the source frame. Display rendering uses the same contain rectangle as the video; geometric calculations explicitly correct the aspect ratio. Camera constraints remain fixed during a session; slow inference reduces analysis frequency instead of changing camera aspect ratio. World coordinates are separately centered at hip midpoint and normalized by calibrated world shoulder width. Image and world units are never mixed.

SDK 0.10.17 exposes `visibility` but does not expose landmark `presence` through its JavaScript result types. The adapter preserves presence if a runtime provides it, otherwise records `null`. Pose presence is gated using `minPosePresenceConfidence: 0.5`; missing per-landmark presence is never fabricated as 1.0. Image confidence and current required landmarks gate scoring; smoothed/cached points are only visual continuity and never used to pass the raw gate.

Quality failures stop accumulation immediately. Recovery requires a continuous second of passing raw checks. A raw failure lasting over 500 ms or a frame gap over 250 ms aborts the attempt. Short failures pause the attempt and exclude bad frames; they are not scored. Calibration requires two consecutive valid seconds. A three-second countdown precedes a three-second valid hold.

The outlier filter rejects isolated image jumps relative to torso scale, allowing elapsed-time-dependent motion and subtracting coherent torso translation. A large relocation can reacquire on a second consistent observation. After five accepted samples, arm/leg 3D lengths are compared to a rolling median of up to 15 samples with broad 0.5–1.75 ratio limits. Projected 2D bone lengths are not constrained because perspective and body turns shorten them. Rejected endpoints and affected distal joints are removed, never snapped into an invented pose. Their smoothing history is discarded immediately; short visual holds of otherwise missing points cannot enter scoring. Tracking history resets on person loss/multiplicity, changed aspect, calibration/reset, or long gaps. Bone histories expire after 1.5 seconds without accepted evidence to allow reacquisition.

These are conservative heuristics, not a learned anatomy model or a guarantee of correct joints. Sustained plausible errors and errors before enough history exists can still pass. Full-body camera recordings with independently annotated joints are needed to quantify improvement over Lite; passing synthetic tests establishes regression behavior, not recognition accuracy.

Lighting, full-body framing, person count, front-facing orientation, required joint reliability, and static root/scale stability all gate scoring. The static stability test intentionally rejects either camera movement or subject movement for this exercise. It does not estimate independent camera motion. Foot opening is an approximate 2D projection and needs frontal camera placement; finger placement and precise gaze are not measured. Rubric tolerances are beta training defaults, not validated formal grades.

## Turn evidence and overlapping knees

Turn scoring uses observed, unsmoothed body yaw after confidence/outlier filtering. UI smoothing and the interpolated sequence graph cannot supply proof of an intermediate pose. Both JavaScript and WASM paths require a front-facing start, continuous reliable timestamps, and at least two observed intermediate angles progressing by 10 degrees between the 12-degree motion threshold and the target tolerance band. A missing transition, static final pose, invalid start or tracking gap returns `notScorable`, not a zero grade. Fast and slow turns remain supported when the camera captures enough evidence.

An observed reversal greater than the existing 15-degree noise allowance prevents a complete-sequence claim and limits the direction criterion to 12/25; a clearly observed wrong-side turn still receives 0/25 for direction. Final-angle and posture tolerances are unchanged. Synthetic DTW distance remains informational and is not used to grade speed or imitate a prescribed timing curve. This analyzes torso rotation, not the prescribed heel/toe stepping sequence or video liveness.

During standing-at-ease assessment, current hip/knee/ankle visibility and 3D availability are checked before smoothing. Knees separated in the image by less than 0.12 torso lengths are treated as unresolved overlap. A per-knee angle median absolute deviation above 8 degrees over the recent 750 ms (at least six observations) is treated as unstable evidence. These gates pause/refuse scoring with a knee-specific explanation; they do not modify the rubric or invent hidden joints. A straight-looking 2D projection can still correctly carry a bent 3D knee, so 2D collinearity alone is not rejected. Stable, high-confidence depth mistakes remain possible with a single RGB camera.

Display mirroring affects only the shared video/overlay transform, not anatomical scoring. Tests cover both turn directions with mirrored/unmirrored display coordinates. Input already mirrored by a virtual-camera application is a different case and needs real-device validation; the app does not silently swap the expected answer to match a detected turn.

## Assets

- WASM files in `public/mediapipe/wasm` are copied byte-for-byte from the installed `@mediapipe/tasks-vision@0.10.17/wasm` package (Apache-2.0 package).
- Active model: `public/models/pose/pose_landmarker_full.task`, official Full float16 revision 1, downloaded from `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task`. Source catalog: https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker.
- Full asset: 9,398,198 bytes; SHA-256 `5134a3aad27a58b93da0088d431f366da362b44e3ccfbe3462b3827a839011b1`. The previous Lite asset is retained but is not selected at runtime. No model training is performed by this project.
- The runtime, model and fallback CPU/GPU processing stay on the local device. Only same-origin static assets are fetched; no webcam frames or landmarks are sent over HTTP.
- Keep the package and all WASM files in sync. Both SIMD and non-SIMD variants are included; only the selected variant is fetched at runtime. Full is about 9.4 MB and each WASM variant about 9.5 MB before transfer compression. Full can require more inference time than Lite; measure sustained performance on target devices.

## Verification

Each assessment outcome (scored or not scorable) opens a native modal immediately, including inside fullscreen. The displayed percentage is the existing rubric score out of 100, not model accuracy. Closing the modal keeps a reopen button beside the camera. Leaving the tab releases capture resources but retains a finished result in memory; retry resets it. A trailing worker analysis cannot overwrite the terminal result stage. Results are still cleared when navigating away from the feature or reloading the page.

`/scripts/pose-results-smoke.html` tests this UI using a synthetic video stream and worker events, without webcam access. Start its fake camera, simulate an outcome, then retry to exercise the real calibration/countdown/scoring processor. Check fullscreen, refusal, close/reopen and the simulated pagehide button. This development fixture is not included in the production build.

Run `npm run test:pose`, `npm run lint`, and `npm run build`.

For a browser-level model/worker check without camera permission:

1. Build the project and run the existing development server.
2. Find the generated `dist/assets/pose.worker-*.js` filename.
3. Open `/scripts/pose-browser-smoke.html?worker=/dist/assets/<generated-worker-filename>`.
4. Run CPU and optional GPU tests. Expect initialization, blank-frame rejection, and disposal acknowledgement. The fixture is outside `public` and is not included in the production website.

Automated coverage includes geometry, scale/translation/mirror invariance, confidence filtering, smoothing expiry, calibration rejection, quality gates, full session transitions, weighted scoring/refusal and worker cancellation. Browser smoke coverage verifies actual self-hosted WASM/model initialization and inference on a synthetic blank image. It does not validate accuracy on real people.

Before presenting this as a graded exercise, validate teacher-approved correct/incorrect examples across physiques, clothing, lighting and front-camera placement. Physical Android/iOS camera switching, sustained thermal performance and full-body scoring require real-device validation; viewport simulation does not establish those capabilities.
