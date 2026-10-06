# MediaPipe Hand Landmarker

Official model, float16 revision 1. Served locally by the website for salute-only hand analysis.

Source: https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task

Documentation: https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js

File size: 7,819,105 bytes.

SHA-256: `fbc2a30080c3c557093b5ddfc334698132eb341044ccee322ccf8bcf3607cde1`

Runtime uses the project's pinned `@mediapipe/tasks-vision` and local WASM assets. No camera images are uploaded. Hand world coordinates are local to the hand; they are not subtracted from Pose world coordinates. Handedness classification scores are not treated as landmark confidence.
