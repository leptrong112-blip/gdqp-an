import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { POSE_CONFIG as C } from '../config';
import { LANDMARK_NAMES, type CanonicalPoseFrame } from '../types';
import type { PoseDetector } from './workerProtocol';
import { SaluteHandDetector } from './SaluteHandDetector';
export class MediaPipePoseDetector implements PoseDetector {
  private model: PoseLandmarker | null = null;
  private disposed = false;
  private hands = new SaluteHandDetector();
  prepareHands() { return this.hands.prepare(); }
  async initialize(delegate: 'CPU' | 'GPU' = 'CPU') {
    const vision = await FilesetResolver.forVisionTasks(new URL(C.wasmPath, self.location.origin).href);
    const model = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: new URL(C.modelPath, self.location.origin).href, delegate },
      runningMode: 'VIDEO', numPoses: 2, minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5, outputSegmentationMasks: false,
    });
    if (this.disposed) { model.close(); throw new Error('Phiên đã dừng.'); }
    this.model = model;
  }
  detect(source: TexImageSource, timestampMs: number, width: number, height: number, trackHands = false): CanonicalPoseFrame {
    if (!this.model) throw new Error('Mô hình chưa sẵn sàng.');
    const start = performance.now();
    const result = this.model.detectForVideo(source, timestampMs);
    const poseMs = performance.now() - start;
    try {
      const aspectRatio = width / height, landmarks: CanonicalPoseFrame['landmarks'] = {};
      if (result.landmarks.length === 1) result.landmarks[0].forEach((p, i) => {
        const world = result.worldLandmarks[0]?.[i];
        const presenceValue = (p as typeof p & { presence?: number }).presence;
        const presence = typeof presenceValue === 'number' ? presenceValue : null;
        const visibility = Number.isFinite(p.visibility) ? p.visibility : 0;
        landmarks[LANDMARK_NAMES[i]] = { image: { x: p.x, y: p.y, z: p.z }, world: world ? { x: world.x, y: world.y, z: world.z } : undefined, visibility, presence, confidence: presence === null ? visibility : Math.min(visibility, presence) };
      });
      return this.hands.detect(source, { timestampMs, personCount: result.landmarks.length, aspectRatio, landmarks }, width, height, trackHands, poseMs);
    } finally { result.close(); }
  }
  dispose() { this.disposed = true; this.model?.close(); this.model = null; this.hands.dispose(); }
}
