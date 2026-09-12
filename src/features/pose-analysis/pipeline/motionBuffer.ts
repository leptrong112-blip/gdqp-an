import { mean, median, mad } from './geometry';

export interface MotionBufferFrame {
  timestampMs: number;
  bodyYawDeg: number;
  confidence: number;
  torsoTilt?: number;
  shoulderTilt?: number;
  leftWristHipDistance?: number;
  rightWristHipDistance?: number;
  isReliable: boolean;
}

/**
 * Bộ đệm lưu trữ dữ liệu chuyển động theo thời gian (Bounded Temporal Motion Buffer).
 * - Bounded: Giới hạn tối đa 150 khung hình (~8-10 giây tại 15-20 FPS), không tăng vô hạn.
 * - Tuyệt đối không lưu trữ ảnh webcam hay dữ liệu nặng.
 * - Tự động xóa sạch khi reset phiên hoặc rời trang.
 */
export class TemporalMotionBuffer {
  private readonly maxFrames: number;
  private buffer: MotionBufferFrame[] = [];

  constructor(maxFrames = 150) {
    this.maxFrames = maxFrames;
  }

  push(frame: MotionBufferFrame) {
    this.buffer.push(frame);
    if (this.buffer.length > this.maxFrames) {
      this.buffer.shift();
    }
  }

  clear() {
    this.buffer = [];
  }

  get length(): number {
    return this.buffer.length;
  }

  get frames(): readonly MotionBufferFrame[] {
    return this.buffer;
  }

  get durationMs(): number {
    if (this.buffer.length < 2) return 0;
    return this.buffer[this.buffer.length - 1].timestampMs - this.buffer[0].timestampMs;
  }

  /**
   * Lấy góc xoay cơ sở (baseline yaw) ở giai đoạn xuất phát.
   */
  getBaselineYaw(windowMs = 600): number | null {
    if (!this.buffer.length) return null;
    const startT = this.buffer[0].timestampMs;
    const initial = this.buffer.filter(f => f.timestampMs - startT <= windowMs && f.isReliable);
    if (!initial.length) return null;
    return median(initial.map(f => f.bodyYawDeg));
  }

  /**
   * Lấy góc xoay trung bình ở các khung hình gần nhất.
   */
  getLatestYaw(windowMs = 400): number | null {
    if (!this.buffer.length) return null;
    const endT = this.buffer[this.buffer.length - 1].timestampMs;
    const recent = this.buffer.filter(f => endT - f.timestampMs <= windowMs && f.isReliable);
    if (!recent.length) return null;
    return median(recent.map(f => f.bodyYawDeg));
  }

  /**
   * Tính độ dịch chuyển góc quay tổng thể so với baseline (Delta Yaw).
   * Dương (+) = Quay trái; Âm (-) = Quay phải.
   */
  getCurrentDeltaYaw(baselineYaw: number, windowMs = 300): number {
    const latest = this.getLatestYaw(windowMs);
    if (latest === null) return 0;
    let diff = latest - baselineYaw;
    // Normalize wrap around -180..180
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    return diff;
  }

  /**
   * Xác định hướng quay chiếm ưu thế từ quỹ đạo chuyển động.
   * - Quay trái: góc xoay tăng dần (dương).
   * - Quay phải: góc xoay giảm dần (âm).
   */
  detectDirection(baselineYaw: number, thresholdDeg = 20): 'left' | 'right' | 'none' {
    if (this.buffer.length < 5) return 'none';
    const deltas = this.buffer
      .filter(f => f.isReliable)
      .map(f => {
        let d = f.bodyYawDeg - baselineYaw;
        while (d > 180) d -= 360;
        while (d < -180) d += 360;
        return d;
      });

    const maxPos = Math.max(0, ...deltas);
    const maxNeg = Math.min(0, ...deltas);

    if (maxPos >= thresholdDeg && maxPos > Math.abs(maxNeg) * 1.5) return 'left';
    if (Math.abs(maxNeg) >= thresholdDeg && Math.abs(maxNeg) > maxPos * 1.5) return 'right';
    return 'none';
  }

  /**
   * Kiểm tra xem tư thế có đang được giữ ổn định (độ lệch góc thấp) trong windowMs qua hay không.
   */
  isHoldingStable(windowMs = 1200, maxYawMad = 8): boolean {
    if (!this.buffer.length) return false;
    const endT = this.buffer[this.buffer.length - 1].timestampMs;
    const holdFrames = this.buffer.filter(f => endT - f.timestampMs <= windowMs && f.isReliable);
    if (holdFrames.length < 8) return false;
    const yaws = holdFrames.map(f => f.bodyYawDeg);
    const jitter = mad(yaws);
    return Number.isFinite(jitter) && jitter <= maxYawMad;
  }

  /**
   * Lấy độ nghiêng thân trung bình trong suốt quá trình.
   */
  getMeanTorsoTilt(): number {
    const tilts = this.buffer
      .filter(f => f.torsoTilt !== undefined && Number.isFinite(f.torsoTilt))
      .map(f => f.torsoTilt!);
    return mean(tilts);
  }

  /**
   * Lấy độ nghiêng vai trung bình.
   */
  getMeanShoulderTilt(): number {
    const tilts = this.buffer
      .filter(f => f.shoulderTilt !== undefined && Number.isFinite(f.shoulderTilt))
      .map(f => f.shoulderTilt!);
    return mean(tilts);
  }
}
