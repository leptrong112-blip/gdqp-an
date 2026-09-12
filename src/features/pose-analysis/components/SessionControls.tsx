import { Camera, RotateCcw, Square, SwitchCamera } from 'lucide-react';
import type { PoseStage } from '../types';
export function SessionControls({ stage, ready, start, stop, calibrate, retry, changeCamera }: { stage: PoseStage; ready: boolean; start: () => void; stop: () => void; calibrate: () => void; retry?: () => void; changeCamera: () => void }) {
  const running = ['quality-check', 'calibrating', 'countdown', 'scoring', 'completed', 'blocked', 'loading-model'].includes(stage);
  const button = 'min-h-12 px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all';
  return <div className="flex flex-wrap gap-3">
    {!running ? (
      <button onClick={stage === 'result' && retry ? retry : start} disabled={stage === 'unsupported'} className={`${button} bg-red-600 text-white hover:bg-red-700 shadow-md`}>
        {stage === 'result' ? <RotateCcw size={18} /> : <Camera size={18} />}
        {stage === 'result' ? 'Thực hiện lại' : 'Bật camera'}
      </button>
    ) : (
      <button onClick={stop} className={`${button} bg-slate-800 text-white hover:bg-slate-700`}>
        <Square size={16} />Dừng camera
      </button>
    )}
    {['quality-check', 'blocked'].includes(stage) && (
      <button disabled={!ready} onClick={calibrate} className={`${button} bg-emerald-600 text-white hover:bg-emerald-700 shadow-md`}>
        <RotateCcw size={18} />Hiệu chuẩn & chấm
      </button>
    )}
    {stage === 'result' && retry && (
      <button onClick={retry} className={`${button} bg-red-600 text-white hover:bg-red-700 shadow-md`}>
        <RotateCcw size={18} />Thực hiện lại
      </button>
    )}
    <button onClick={changeCamera} disabled={stage === 'loading-model'} className={`${button} border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800`}>
      <SwitchCamera size={18} />Đổi camera
    </button>
  </div>;
}
