/** Test-only virtual video source. Never requests a physical camera. */
import { useCallback, useRef } from 'react';

export function usePoseCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const state = useRef<{ stream: MediaStream; timer: ReturnType<typeof setInterval> } | null>(null);
  const stop = useCallback(() => {
    if (state.current) {
      clearInterval(state.current.timer);
      state.current.stream.getTracks().forEach(track => track.stop());
      state.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);
  const start = useCallback(async () => {
    stop();
    const video = videoRef.current;
    if (!video) throw new Error('QA virtual viewport missing');
    const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 480;
    const ctx = canvas.getContext('2d')!;
    const paint = () => {
      ctx.fillStyle = '#888'; ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = '#fff'; ctx.font = '24px sans-serif';
      ctx.fillText('QA: SYNTHETIC POSE — NO WEBCAM', 35, 220);
      ctx.fillText(String(performance.now().toFixed(0)), 35, 260);
    };
    paint();
    const stream = canvas.captureStream(30);
    state.current = { stream, timer: setInterval(paint, 33) };
    video.muted = true; video.srcObject = stream;
    await video.play();
    return video;
  }, [stop]);
  return { videoRef, start, stop };
}
