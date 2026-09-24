import React from 'react';
import type { FlightCamStatus } from './FlightCamPipRenderer';

export interface FlightCamPipOverlayProps {
  enabled: boolean;
  status: FlightCamStatus | null;
  distance?: number;
}

export default function FlightCamPipOverlay({ enabled, status, distance }: FlightCamPipOverlayProps) {
  if (!enabled) return null;

  const state = status?.state ?? 'idle';
  const isTracking = state === 'tracking';
  const isImpact = state === 'impact';
  const isHit = status?.isHit ?? false;

  return (
    <div
      aria-label="Flight Camera Picture in Picture"
      className="absolute top-14 sm:top-16 right-2 sm:right-4 z-20 w-[180px] sm:w-[260px] aspect-video rounded-xl border border-cyan-500/50 shadow-2xl pointer-events-none select-none flex flex-col justify-between p-2 overflow-hidden bg-slate-950/30 backdrop-blur-[1px]"
    >
      {/* Corner crosshair brackets */}
      <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400/80 pointer-events-none" />
      <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-400/80 pointer-events-none" />
      <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-400/80 pointer-events-none" />
      <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-400/80 pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between text-[10px] font-mono font-black tracking-wider text-cyan-300 drop-shadow">
        <div className="flex items-center gap-1.5">
          {isTracking ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-red-400 font-bold">REC 0.25X</span>
            </>
          ) : isImpact ? (
            <span className={isHit ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {isHit ? 'HIT TARGET' : 'MISS'}
            </span>
          ) : (
            <span className="text-slate-400">STANDBY</span>
          )}
        </div>
        <span className="rounded bg-black/60 px-1.5 py-0.5 text-[9px] border border-cyan-500/30">
          WASM CAM
        </span>
      </div>

      {/* Center Subtle Reticle */}
      <div className="self-center flex items-center justify-center opacity-40">
        <div className="w-6 h-6 border border-cyan-400/60 rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-amber-400 rounded-full" />
        </div>
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="flex items-center justify-between text-[9px] font-mono font-bold text-slate-200 bg-black/70 px-1.5 py-0.5 rounded border border-white/10">
        <span className="truncate max-w-[120px] sm:max-w-[170px]">
          {isTracking ? 'ĐANG THEO DÕI...' : isImpact ? (status?.text ?? '') : 'CHỜ LƯỢT TIẾP THEO'}
        </span>
        <span className="text-amber-400 ml-1 shrink-0">
          {distance ? `${distance}M` : ''}
        </span>
      </div>
    </div>
  );
}
