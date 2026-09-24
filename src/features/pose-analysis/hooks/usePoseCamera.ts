import { useCallback, useRef } from 'react';
export function usePoseCamera() {
  const videoRef = useRef<HTMLVideoElement>(null), stream = useRef<MediaStream | null>(null), generation = useRef(0);
  const stop = useCallback(() => {
    generation.current++;
    stream.current?.getTracks().forEach(track => track.stop()); stream.current = null;
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.srcObject = null; }
  }, []);
  const start = useCallback(async (facingMode: 'user' | 'environment', ended: () => void) => {
    stop(); const token = generation.current;
    const media = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
        aspectRatio: { ideal: 16 / 9 },
        frameRate: { ideal: 24, max: 30 },
      },
    });
    if (token !== generation.current) { media.getTracks().forEach(t => t.stop()); throw new Error('Phiên đã dừng.'); }
    stream.current = media;
    media.getVideoTracks()[0].addEventListener('ended', ended, { once: true });
    const video = videoRef.current;
    if (!video) { stop(); throw new Error('Không mở được khung camera.'); }
    video.srcObject = media;
    await video.play();
    if (token !== generation.current) throw new Error('Phiên đã dừng.');
    return video;
  }, [stop]);
  // Keep capture geometry fixed for the lifetime of the detector session.
  // Performance adaptation belongs to the analysis scheduler, not the camera.
  return { videoRef, start, stop };
}
