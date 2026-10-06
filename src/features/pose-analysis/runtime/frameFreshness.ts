export const MAX_TRANSPORT_FRAME_AGE_MS = 200;
/** Per-attempt worker input guard. No queue and no timestamp repair/interpolation. */
export class FrameFreshnessGate {
  private last = -Infinity;
  reset() { this.last = -Infinity; }
  accept(timestampMs: number, capturedAtMs: number | undefined, nowMs: number) {
    if (!Number.isFinite(timestampMs) || timestampMs < 0 || timestampMs <= this.last) return false;
    if (capturedAtMs !== undefined && (!Number.isFinite(capturedAtMs) || nowMs - capturedAtMs > MAX_TRANSPORT_FRAME_AGE_MS || capturedAtMs - nowMs > 50)) return false;
    this.last = timestampMs; return true;
  }
}
