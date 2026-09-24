import { useEffect, useRef, useState, type RefObject } from 'react';
import { ADS_STORAGE_KEY, sanitizeAlignment, moveLook, type AdsVisualAlignment } from './rangeVisualConfig';

export function useRangeControls(container: RefObject<HTMLDivElement | null>, options: {
  active: boolean; round: string | number; fire: () => void; ads: (held: boolean) => void; release: () => void; toggleAds?: () => void;
}) {
  const [locked, setLocked] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [panel, setPanel] = useState(false);
  const [previewAds, setPreviewAds] = useState(true);
  const [error, setError] = useState('');
  const [alignment, setAlignmentState] = useState<AdsVisualAlignment>(() => {
    try { return sanitizeAlignment(JSON.parse(localStorage.getItem(ADS_STORAGE_KEY) || 'null')); }
    catch { return sanitizeAlignment(null); }
  });
  const look = useRef({ x: 0, y: 0, active: false });
  const latest = useRef({ ...options, panel });
  latest.current = { ...options, panel };
  const requesting = useRef(false);
  const setAlignment = (value: AdsVisualAlignment) => {
    const safe = sanitizeAlignment(value);
    setAlignmentState(safe);
    try { localStorage.setItem(ADS_STORAGE_KEY, JSON.stringify(safe)); }
    catch { setError('Không lưu được thiết lập; thay đổi vẫn áp dụng trong phiên này.'); }
  };
  useEffect(() => {
    look.current = { x: 0, y: 0, active: false };
    setPanel(false);
  }, [options.round]);
  useEffect(() => {
    if (!options.active) { setPanel(false); return; }
    try { setAlignmentState(sanitizeAlignment(JSON.parse(localStorage.getItem(ADS_STORAGE_KEY) || 'null'))); }
    catch { /* Keep the current session's usable settings when storage is unavailable. */ }
  }, [options.active]);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let disposed = false;
    let lastTouch = -Infinity;
    const owned = () => document.pointerLockElement === element;
    const release = () => { latest.current.ads(false); latest.current.release(); };
    const lockChange = () => {
      if (disposed) return;
      requesting.current = false;
      const isLocked = owned();
      setLocked(isLocked);
      release();
      look.current.active = isLocked;
      if (isLocked) setError('');
    };
    const lockError = () => {
      requesting.current = false;
      if (!disposed) setError('Trình duyệt chưa cho phép điều khiển chuột. Nhấp lại để thử, hoặc dùng các nút điều khiển.');
    };
    const pointer = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') { lastTouch = performance.now(); look.current.active = false; }
    };
    // Mouse events report every button transition, unlike chorded pointerdown/up.
    const down = (event: MouseEvent) => {
      if (performance.now() - lastTouch < 800 || !latest.current.active || latest.current.panel) return;
      if (!owned() && (event.target as Element).closest('button, input, select, [data-range-controls]')) return;
      event.preventDefault();
      if (!owned()) {
        if (event.button !== 0 || requesting.current) return;
        element.focus({ preventScroll: true });
        if (!element.requestPointerLock) { lockError(); return; }
        requesting.current = true;
        try {
          const result = element.requestPointerLock();
          Promise.resolve(result).then(() => {
            if ((disposed || !latest.current.active || latest.current.panel) && owned()) document.exitPointerLock();
          }).catch(lockError);
        } catch { lockError(); }
        return; // Acquiring control must not consume a round.
      }
      latest.current.ads((event.buttons & 2) !== 0);
      if (event.button === 0) latest.current.fire();
      if (event.button === 1) latest.current.toggleAds?.();
    };
    const up = (event: MouseEvent) => { if (owned()) latest.current.ads((event.buttons & 2) !== 0); };
    const move = (event: MouseEvent) => {
      if (!owned() || !latest.current.active || latest.current.panel) return;
      Object.assign(look.current, moveLook(look.current, event.movementX, event.movementY));
    };
    const fullscreenChange = () => setFullscreen(document.fullscreenElement === element);
    const blur = () => { release(); look.current.active = false; if (owned()) document.exitPointerLock(); };
    const visibility = () => { if (document.hidden) blur(); };
    element.addEventListener('pointerdown', pointer, true);
    element.addEventListener('mousedown', down);
    document.addEventListener('mouseup', up);
    document.addEventListener('mousemove', move);
    document.addEventListener('pointerlockchange', lockChange);
    document.addEventListener('pointerlockerror', lockError);
    document.addEventListener('fullscreenchange', fullscreenChange);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('blur', blur);
    fullscreenChange();
    return () => {
      disposed = true;
      requesting.current = false;
      element.removeEventListener('pointerdown', pointer, true);
      element.removeEventListener('mousedown', down);
      document.removeEventListener('mouseup', up);
      document.removeEventListener('mousemove', move);
      document.removeEventListener('pointerlockchange', lockChange);
      document.removeEventListener('pointerlockerror', lockError);
      document.removeEventListener('fullscreenchange', fullscreenChange);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('blur', blur);
      if (owned()) document.exitPointerLock();
      setLocked(false);
      release();
    };
  }, [container, options.active, options.round]);
  useEffect(() => {
    if ((!options.active || panel) && document.pointerLockElement === container.current) document.exitPointerLock();
  }, [container, options.active, panel]);
  const toggleFullscreen = async () => {
    const element = container.current;
    if (!element) return;
    try {
      if (document.fullscreenElement === element) await document.exitFullscreen();
      else await element.requestFullscreen();
      setError('');
    } catch { setError('Không thể mở toàn màn hình trên trình duyệt này.'); }
  };
  return { locked, fullscreen, panel, setPanel, previewAds, setPreviewAds, error, alignment, setAlignment, look, toggleFullscreen, active: options.active };
}
