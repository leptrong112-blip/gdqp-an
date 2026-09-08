import { useCallback, useEffect, useRef, useState } from 'react';
import ShootingRange3D, { RangeImpact } from './ShootingRange3D';
import { ammoAction, ARCADE_EXERCISES, initialAmmo } from './arcadeRangeLogic';
import type { TargetId } from '../data/akShootingData';

type Shot = RangeImpact & { shotNumber: number };
export default function ArcadeRangeSection() {
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const exercise = ARCADE_EXERCISES[exerciseIndex];
  const [roundKey, setRoundKey] = useState(0);
  const [ammo, setAmmo] = useState(() => initialAmmo(exercise));
  const ammoRef = useRef(ammo);
  const [shots, setShots] = useState<Shot[]>([]);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [flying, setFlying] = useState(false);
  const flightLock = useRef(false);
  const epoch = useRef(0);
  const [reloadProgress, setReloadProgress] = useState(0);
  const reloadElapsed = useRef(0);
  const [aim, setAim] = useState({ x: 0, y: 0 });
  const [report, setReport] = useState('');
  const fireRef = useRef<((aim?: { x: number; y: number }) => Promise<RangeImpact | null>) | null>(null);
  const legacyRef = useRef<(() => RangeImpact | null) | null>(null);
  const totalRounds = exercise.rounds * exercise.magazines;
  const completed = shots.length === totalRounds;
  const running = started && !paused && !completed;
  const targetId: TargetId = exercise.distance === 10 ? 'dong_tien' : exercise.distance === 100 ? 'bia_4' : 'bia_8';
  const changeAmmo = useCallback((value: typeof ammo) => { ammoRef.current = value; setAmmo(value); }, []);
  useEffect(() => () => { epoch.current++; }, []);
  useEffect(() => {
    const pause = () => setPaused(true);
    const visibility = () => { if (document.hidden) pause(); };
    window.addEventListener('blur', pause); document.addEventListener('visibilitychange', visibility);
    return () => { window.removeEventListener('blur', pause); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  const reset = (index = exerciseIndex) => {
    epoch.current++; flightLock.current = false; setFlying(false);
    setExerciseIndex(index); changeAmmo(initialAmmo(ARCADE_EXERCISES[index]));
    setShots([]); setStarted(false); setPaused(false); setReport('');
    reloadElapsed.current = 0; setReloadProgress(0); setAim({ x: 0, y: 0 }); setRoundKey(k => k + 1);
  };
  const fire = useCallback(async (shotAim?: { x: number; y: number }) => {
    if (!running || flightLock.current || !fireRef.current) return;
    const previous = ammoRef.current;
    const next = ammoAction(previous, 'fire', exercise);
    if (next === previous) { setReport(previous.reloading ? 'Đang thay băng…' : 'Băng đã hết. Nhấn R hoặc nút Thay băng.'); return; }
    const token = epoch.current;
    flightLock.current = true; setFlying(true); changeAmmo(next); setReport('Đang bắn…');
    try {
      const impact = await fireRef.current(shotAim);
      if (token !== epoch.current) return;
      if (!impact) { changeAmmo(previous); setReport('Cảnh đang tải. Hãy thử lại.'); return; }
      setShots(prev => [...prev, { ...impact, shotNumber: prev.length + 1 }]);
      setReport(impact.isHit ? `Bia ${(impact.targetIndex ?? 0) + 1}: +${impact.score} điểm` : 'Trượt bia · 0 điểm');
    } catch {
      if (token === epoch.current) { changeAmmo(previous); setReport('Không thể thực hiện lượt này. Hãy thử lại.'); }
    } finally {
      if (token === epoch.current) { flightLock.current = false; setFlying(false); }
    }
  }, [running, exercise, changeAmmo]);
  const reload = useCallback(() => {
    if (!running || flightLock.current) return;
    const next = ammoAction(ammoRef.current, 'reload', exercise);
    if (next === ammoRef.current) return;
    reloadElapsed.current = 0; setReloadProgress(0); changeAmmo(next); setReport('Đang thay băng…');
  }, [running, exercise, changeAmmo]);
  useEffect(() => {
    if (!running || !ammo.reloading) return;
    const token = epoch.current;
    const timer = window.setInterval(() => {
      if (token !== epoch.current) return;
      reloadElapsed.current += .1;
      setReloadProgress(Math.min(1, reloadElapsed.current / 1.2));
      if (reloadElapsed.current >= 1.2) {
        window.clearInterval(timer); changeAmmo(ammoAction(ammoRef.current, 'loaded', exercise)); setReport('Băng mới đã sẵn sàng.');
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [running, ammo.reloading, exercise, changeAmmo]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.repeat || (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"]'))) return;
      if (event.code === 'KeyR' || event.key.toLowerCase() === 'r') { event.preventDefault(); reload(); }
      if (event.code === 'Space' || event.key === ' ') { event.preventDefault(); void fire(); }
      if (event.key === 'Escape' && started && !completed) setPaused(p => !p);
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [reload, fire, started, completed]);
  const score = shots.reduce((sum, shot) => sum + shot.score, 0);
  const hits = shots.filter(s => s.isHit).length;
  const canReload = running && !flying && !ammo.reloading && ammo.left === 0 && ammo.magazine < exercise.magazines;
  const pointerAim = (event: { clientX: number; clientY: number; currentTarget: HTMLElement }) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1)), y: Math.max(-1, Math.min(1, 1 - (event.clientY - rect.top) / rect.height * 2)) };
  };
  return <div className="space-y-4">
    <div className="flex flex-wrap gap-2">{ARCADE_EXERCISES.map((ex, i) => <button key={ex.id} onClick={() => reset(i)} className={`rounded-xl px-4 py-3 text-sm font-bold cursor-pointer ${i === exerciseIndex ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-200'}`}>{ex.title}</button>)}</div>
    <div className="rounded-2xl bg-cyan-950/60 border border-cyan-700/40 p-4 text-sm text-cyan-100">
      <strong>Game arcade · {exercise.magazines} băng × {exercise.rounds} viên = {totalRounds} lượt</strong>
      <p className="mt-1 text-xs text-cyan-200">Hoàn thành khi dùng đủ tất cả các băng. {exercise.targets} bia {exercise.moving ? 'di chuyển qua lại' : 'cố định'}. Hiệu ứng và thời gian bay theo cơ chế game; cự ly là thông số màn chơi.</p>
    </div>
    <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)] gap-4">
      <div className="relative h-[550px] sm:h-[640px] rounded-3xl overflow-hidden border border-slate-700 bg-slate-950 touch-none"
        onPointerMove={e => {
          if (!running || (e.target as HTMLElement).closest('button')) return;
          setAim(pointerAim(e));
        }}
        onPointerDown={e => { if (e.button === 0 && !(e.target as HTMLElement).closest('button')) { e.preventDefault(); const shotAim = pointerAim(e); setAim(shotAim); void fire(shotAim); } }}>
        <ShootingRange3D key={roundKey} ads={false} aim={aim} sway={{ x: 0, y: 0 }} recoil={{ x: 0, y: 0 }} targetId={targetId} shots={shots} fireRef={legacyRef}
          arcade={{ moving: exercise.moving, running, targets: exercise.targets, reloading: ammo.reloading, fireRef }} />
        <div className="absolute top-4 left-4 right-4 flex flex-wrap justify-between gap-2 pointer-events-none text-xs font-bold text-white">
          <span className="rounded-xl bg-slate-950/80 px-3 py-2">BĂNG {ammo.magazine}/{exercise.magazines} · CÒN {ammo.left}/{exercise.rounds} VIÊN</span>
          <span className="rounded-xl bg-slate-950/80 px-3 py-2">TIẾN ĐỘ {shots.length}/{totalRounds}</span>
        </div>
        {report && <div aria-live="polite" className="absolute top-16 left-4 rounded-xl bg-cyan-950/90 px-3 py-2 text-xs text-cyan-100 pointer-events-none">{report}</div>}
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap justify-between gap-2" onPointerMove={e => e.stopPropagation()}>
          <button disabled={!started || completed} onClick={() => setPaused(p => !p)} className="rounded-xl bg-slate-950/90 px-3 py-3 text-xs text-white disabled:opacity-40">{paused ? 'Tiếp tục' : 'Tạm dừng'}</button>
          <button disabled={!canReload} onClick={reload} className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-50">{ammo.reloading ? `Đang thay ${Math.round(reloadProgress * 100)}%` : 'Thay băng [R]'}</button>
          <button disabled={!running || flying || ammo.reloading || ammo.left === 0} onClick={() => void fire()} className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{flying ? 'Đang bay…' : 'Bắn [Space]'}</button>
        </div>
        {(!started || paused || completed) && <div className="absolute inset-0 z-10 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center text-white gap-4">
          <h3 className="text-2xl font-black">{completed ? 'Hoàn thành bài game!' : paused && started ? 'Đã tạm dừng' : exercise.title}</h3>
          <p className="text-sm max-w-md">{completed ? `${score}/${totalRounds * 10} điểm · ${hits}/${totalRounds} lượt trúng · ${ammo.reloads} lần thay băng` : 'Di chuột để điều khiển tâm. Click hoặc Space để bắn. Dùng hết băng rồi nhấn R để thay. Esc để tạm dừng.'}</p>
          {completed ? <div className="flex gap-3"><button className="rounded-xl bg-cyan-600 p-3 font-bold" onClick={() => reset()}>Chơi lại</button>{exerciseIndex < ARCADE_EXERCISES.length - 1 && <button className="rounded-xl bg-amber-500 text-slate-950 p-3 font-bold" onClick={() => reset(exerciseIndex + 1)}>Bài tiếp theo →</button>}</div>
            : <button className="rounded-xl bg-cyan-600 px-7 py-3 font-bold" onClick={() => { setStarted(true); setPaused(false); }}> {started ? 'Tiếp tục chơi' : 'Bắt đầu bài game'} </button>}
        </div>}
      </div>
      <aside className="rounded-3xl border border-slate-700 bg-slate-900 p-5 text-slate-100 space-y-4">
        <div className="flex justify-between items-center"><h3 className="font-bold">Kết quả arcade</h3><button onClick={() => reset()} className="text-xs text-cyan-300">Làm lại</button></div>
        <div className="text-4xl font-black text-cyan-300">{score}<span className="text-base text-slate-400"> / {totalRounds * 10}</span></div>
        <progress className="w-full accent-cyan-400" value={shots.length} max={totalRounds} />
        <p className="text-xs">Đã dùng {ammo.fired}/{totalRounds} viên · Thay băng {ammo.reloads}/{exercise.magazines - 1} lần</p>
        {Array.from({ length: exercise.targets }, (_, lane) => <div key={lane} className="flex justify-between rounded-xl bg-slate-800 p-3 text-xs"><span>Bia {lane + 1}</span><span>{shots.filter(s => s.isHit && s.targetIndex === lane).length} lượt trúng</span></div>)}
        <div className="max-h-56 overflow-y-auto space-y-2" aria-label="Lịch sử lượt bắn">{shots.map(shot => <div key={shot.shotNumber} className="flex justify-between text-xs"><span>Lượt {shot.shotNumber} · {shot.isHit ? `Bia ${(shot.targetIndex ?? 0) + 1}` : 'Trượt'}</span><strong className="text-cyan-300">+{shot.score}</strong></div>)}</div>
        <p className="text-xs text-slate-400">Điểm được chốt khi vệt bắn tới mặt phẳng bia. Bia có thể đổi vị trí trong thời gian bay.</p>
      </aside>
    </div>
  </div>;
}
