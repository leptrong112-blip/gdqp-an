import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import type { CanonicalPoseFrame, HandFeatures } from '../types';
import { handFeatures, handSharpness, matchSaluteHand, raisedSaluteWrist } from '../pipeline/saluteHand';
import { POSE_CONFIG as C } from '../config';

export class SaluteHandDetector {
  private model: HandLandmarker | null = null;
  private state: 'idle' | 'loading' | 'ready' | 'failed' = 'idle';
  private disposed = false;
  private canvas: OffscreenCanvas | HTMLCanvasElement | null = null;
  private lastTime = -Infinity;
  private lastHand: CanonicalPoseFrame['saluteHand'];
  private lastCost = 0;
  private lastLabel?: string;
  private labelRun = 0;
  private qualityCanvas: OffscreenCanvas | HTMLCanvasElement | null = null;
  private evidence?: HandFeatures;
  private lastFps = 0;
  private loading?: Promise<void>;
  prepare() {
    if (this.state === 'idle') this.loading = this.load();
    return this.loading ?? Promise.resolve();
  }
  private async load() {
    this.state = 'loading';
    try {
      const vision = await FilesetResolver.forVisionTasks(new URL(C.wasmPath, self.location.origin).href);
      const model = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: new URL('/models/pose/hand_landmarker.task', self.location.origin).href, delegate: 'CPU' },
        // Moving crops change the coordinate system, so do not reuse VIDEO tracking state.
        runningMode: 'IMAGE', numHands: 2, minHandDetectionConfidence: .65, minHandPresenceConfidence: .65,
      });
      if (this.disposed) { model.close(); return; }
      this.model = model; this.state = 'ready';
    } catch { if (!this.disposed) this.state = 'failed'; }
  }
  detect(source: TexImageSource, frame: CanonicalPoseFrame, width: number, height: number, enabled: boolean, poseMs = 0): CanonicalPoseFrame {
    const unavailable = (reason: string, validLandmarks = 0) => {
      this.evidence = { available:false, quality:'INSUFFICIENT_HAND_EVIDENCE', validLandmarks, reason };
    };
    const report = (value: CanonicalPoseFrame, handMs = 0, fps = this.lastFps): CanonicalPoseFrame => ({ ...value,
      handEvidence: !value.saluteHand && this.evidence ? { ...this.evidence, available: false, quality: 'INSUFFICIENT_HAND_EVIDENCE', reason: this.evidence.reason ?? 'Bàn tay chưa có quan sát mới đủ rõ.' } : undefined,
      detectorTelemetry: {
      poseMs, handMs, handFps: fps, handConfidence: value.saluteHand?.confidence ?? this.evidence?.confidence, handedness: value.saluteHand?.handedness ?? this.evidence?.handedness,
      handLandmarks: value.saluteHand?.image.length ?? this.evidence?.validLandmarks ?? 0, handSharpness: value.saluteHand?.sharpness,
    } });
    if (!enabled || this.disposed) { this.lastHand = undefined; this.lastLabel = undefined; this.labelRun = 0; this.evidence = undefined; this.lastFps = 0; return report(frame); }
    if (this.state === 'idle') void this.prepare();
    if (this.state !== 'ready') {
      unavailable(this.state === 'failed' ? 'Không tải được mô hình bàn tay. Thử tải lại trang; phần cơ thể vẫn được theo dõi.' : 'Đang tải mô hình nhận diện bàn tay; chưa có số đo ngón tay.');
      return report({ ...frame, handStatus: this.state === 'failed' ? 'unavailable' : 'loading' });
    }
    if (!raisedSaluteWrist(frame)) {
      this.lastHand = undefined; this.lastLabel = undefined; this.labelRun = 0;
      unavailable('Chưa xác nhận cổ tay phải đủ rõ ở vùng chào để kiểm tra bàn tay.');
      return report({ ...frame, handStatus: 'waiting' });
    }
    // Pose first. A costly hand call is decimated, not queued on intervening frames.
    const interval = Math.max(poseMs > 90 ? 166 : poseMs > 55 ? 100 : 65, (poseMs + this.lastCost) * 2);
    if (frame.timestampMs - this.lastTime < interval) {
      const fresh = this.lastHand && frame.timestampMs - this.lastHand.timestampMs <= 100 ? this.lastHand : undefined;
      if (!fresh && this.evidence?.available) unavailable(`Đang chờ mẫu bàn tay mới; nhịp lấy mẫu dự kiến ${Math.round(interval)} ms.`,21);
      return report({ ...frame, handStatus: fresh ? 'observed' : 'waiting', saluteHand:fresh });
    }
    const gap = frame.timestampMs - this.lastTime, started = performance.now();
    this.lastTime = frame.timestampMs;
    try {
      if (!this.canvas) this.canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(384,384) : Object.assign(document.createElement('canvas'), { width:384, height:384 });
      const ctx = this.canvas.getContext('2d') as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null;
      if (!ctx) throw new Error('Canvas unavailable');
      const ls = frame.landmarks.leftShoulder!.image, rs = frame.landmarks.rightShoulder!.image, wrist = frame.landmarks.rightWrist!.image;
      const span = Math.hypot((ls.x-rs.x)*width,(ls.y-rs.y)*height);
      const size = Math.min(width,height,Math.max(80,span*1.3));
      const x = Math.max(0,Math.min(width-size,wrist.x*width-size/2)), y = Math.max(0,Math.min(height-size,wrist.y*height-size/2));
      if (!this.qualityCanvas) this.qualityCanvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(128,128) : Object.assign(document.createElement('canvas'), { width:128, height:128 });
      const qctx = this.qualityCanvas.getContext('2d', { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null;
      if (!qctx) throw new Error('Canvas unavailable');
      const qsize = Math.min(128, Math.floor(size));
      qctx.drawImage(source as CanvasImageSource,x,y,size,size,0,0,qsize,qsize);
      const sharpness = handSharpness(qctx.getImageData(0,0,qsize,qsize).data, qsize, qsize);
      ctx.drawImage(source as CanvasImageSource,x,y,size,size,0,0,384,384);
      const result = this.model!.detect(this.canvas);
      const images = result.landmarks.map(hand => hand.map(p => ({ x:(x+p.x*size)/width, y:(y+p.y*size)/height, z:p.z*size/width })));
      const reasons:string[]=[];
      this.lastHand = matchSaluteHand(frame,images,result.worldLandmarks,width,height,reasons);
      if (this.lastHand) {
        const index = images.indexOf(this.lastHand.image);
        const classification = result.handedness[index]?.[0];
        const label = classification?.categoryName;
        this.labelRun = label && label === this.lastLabel ? this.labelRun + 1 : 1;
        this.lastLabel = label;
        // Label is diagnostic/identity consistency only. Pose's anatomical right wrist selects the hand.
        this.lastHand = { ...this.lastHand, confidence: classification?.score ?? 0, handedness: label,
          identityStable: this.labelRun >= 2, sharpness };
        this.evidence = handFeatures({ ...frame, saluteHand: this.lastHand });
        if (!this.evidence.available) this.lastHand = undefined;
      } else {
        this.lastLabel = undefined; this.labelRun = 0;
        unavailable(reasons[0] ?? 'Chưa ghép được bàn tay hợp lệ với cổ tay phải.',Math.max(0,...images.map(points=>points.length)));
      }
      this.lastCost = performance.now() - started;
      this.lastFps = Number.isFinite(gap) ? 1000/gap : 0;
      return report({ ...frame, handStatus: this.lastHand ? 'observed' : 'not-visible', saluteHand:this.lastHand }, this.lastCost);
    } catch {
      this.lastHand = undefined;
      this.lastLabel = undefined; this.labelRun = 0;
      unavailable('Bộ xử lý bàn tay gặp lỗi ở khung hình này; đang chờ lần nhận diện tiếp theo.');
      this.lastCost = performance.now() - started;
      return report({ ...frame, handStatus:'unavailable', saluteHand:undefined }, this.lastCost);
    }
  }
  dispose() { this.disposed = true; this.model?.close(); this.model = null; this.canvas = null; this.qualityCanvas = null; this.lastHand = undefined; }
}
