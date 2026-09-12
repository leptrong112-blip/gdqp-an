import { useRef, useState, type RefObject } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import type { PoseStage } from '../types';

export function PoseViewport({
  videoRef,
  canvasRef,
  mirrored,
  stage,
  progress,
  isFullscreen = false,
  onToggleFullscreen,
}: {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  mirrored: boolean;
  stage: PoseStage;
  progress: number;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}) {
  const container = useRef<HTMLDivElement>(null), [localExpanded, setLocalExpanded] = useState(false);
  const active = ['quality-check', 'calibrating', 'countdown', 'scoring', 'completed', 'blocked'].includes(stage);
  const holdSeconds = (progress * 3.0).toFixed(1);
  const labels: Partial<Record<PoseStage, string>> = {
    'loading-model': 'Đang mở camera và tải mô hình…',
    calibrating: 'Giữ nguyên tư thế để hiệu chuẩn (2 giây)',
    countdown: `Chuẩn bị đứng nghiêm · ${Math.max(1, Math.ceil(3 * (1 - progress)))}`,
    scoring: `Đang chấm... Giữ nguyên tư thế (${holdSeconds} / 3.0s)`,
    completed: '✓ Hoàn thành bài! Đang tính điểm...',
    result: 'Đã hoàn tất bài tập · Sẵn sàng thực hiện lại',
  };

  const expanded = isFullscreen || localExpanded;

  const handleToggle = async () => {
    if (onToggleFullscreen) {
      onToggleFullscreen();
    } else {
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      else if (!localExpanded && container.current?.requestFullscreen) await container.current.requestFullscreen().catch(() => setLocalExpanded(true));
      else setLocalExpanded(!localExpanded);
    }
  };

  return (
    <div
      ref={container}
      className={`${
        isFullscreen
          ? 'relative h-full w-full'
          : localExpanded
          ? 'fixed inset-0 z-[100] h-dvh'
          : 'relative h-[62vh] min-h-[360px] lg:h-[75vh] xl:h-[78vh]'
      } overflow-hidden rounded-3xl bg-slate-950 border border-slate-700 shadow-2xl transition-all`}
    >
      <div className="absolute inset-0" style={{ transform: mirrored ? 'scaleX(-1)' : undefined }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-contain"
          aria-label="Hình ảnh trực tiếp từ camera"
        />
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full pointer-events-none" aria-hidden="true" />
      </div>

      {stage === 'completed' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 animate-in zoom-in-95 duration-200">
          <div className="bg-emerald-950/90 border-2 border-emerald-400 text-white px-7 py-5 rounded-3xl shadow-2xl flex items-center gap-3.5 backdrop-blur-xl">
            <span className="text-3xl">🎉</span>
            <div>
              <p className="font-black text-lg text-amber-300">✓ Hoàn thành bài!</p>
              <p className="text-xs text-emerald-100 font-medium">Đang tổng hợp kết quả đánh giá...</p>
            </div>
          </div>
        </div>
      )}

      {stage === 'idle' && (
        <div className="absolute inset-0 grid place-content-center px-8 text-center text-slate-300 pointer-events-none">
          <p className="text-lg font-bold">Sẵn sàng vào tư thế</p>
          <p className="text-sm mt-2">Bật camera, đặt máy cố định thấy rõ từ đầu đến bàn chân.</p>
        </div>
      )}

      <div className="absolute top-4 left-4 right-4 flex justify-between gap-3 items-start z-10">
        <span className="rounded-full bg-slate-900/90 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-white border border-slate-700/50 shadow-md flex items-center gap-2">
          {stage === 'completed' || stage === 'result' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Camera sẵn sàng · Tạm dừng phân tích</span>
            </>
          ) : active ? (
            <>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>Camera đang bật · xử lý trên thiết bị</span>
            </>
          ) : stage === 'loading-model' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Đang khởi tạo camera</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span>Camera đã tắt</span>
            </>
          )}
        </span>

        <button
          aria-label={expanded ? 'Thu nhỏ khung hình' : 'Phóng to toàn màn hình'}
          onClick={handleToggle}
          className="flex items-center gap-2 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl border border-slate-700/60 shadow-lg cursor-pointer transition-all hover:scale-105"
          title={expanded ? 'Thu nhỏ khung hình' : 'Bật toàn màn hình để dễ quan sát khi lùi xa máy'}
        >
          {expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          <span className="hidden sm:inline">{expanded ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
        </button>
      </div>

      {active && labels[stage] && !isFullscreen && stage !== 'completed' && (
        <div className="absolute bottom-6 left-6 right-6 bg-slate-950/90 rounded-2xl p-4 text-center text-white border border-slate-800 backdrop-blur-md shadow-2xl">
          <p className="font-bold text-base sm:text-lg" role="status">
            {labels[stage]}
          </p>
          <div className="h-2 bg-slate-800 rounded-full mt-2.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-150 ${
                stage === 'scoring' ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
