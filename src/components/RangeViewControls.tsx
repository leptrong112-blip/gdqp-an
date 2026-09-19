import React, { useState, useEffect } from 'react';
import { 
  Maximize, 
  Minimize, 
  Settings, 
  X, 
  Crosshair, 
  Sliders, 
  RotateCcw, 
  Palette, 
  Grid, 
  ChevronLeft, 
  ChevronRight, 
  Eye,
  Info
} from 'lucide-react';
import { 
  DEFAULT_ADS_ALIGNMENT, 
  VISUAL_OFFSET_LIMIT_POS, 
  VISUAL_OFFSET_LIMIT_ROT, 
  saveAdsAlignment,
  type AdsVisualAlignment 
} from './rangeVisualConfig';
import type { useRangeControls } from './useRangeControls';
import { 
  loadReticleConfig, 
  saveReticleConfig, 
  DEFAULT_RETICLE_CONFIG, 
  RETICLE_COLORS,
  type ReticleConfig, 
  type AdsReticleStyle,
  type ReticleColorPreset
} from './rangeReticleConfig';
import { ShootingReticleHUD } from './ShootingReticleHUD';
import { 
  SIGHT_PRESETS, 
  DEFAULT_PRESET_ID, 
  getSightPreset, 
  saveSightPreset, 
  type SightPresetConfig 
} from './rangeSightPresets';

interface RangeViewControlsProps { 
  controls: ReturnType<typeof useRangeControls>; 
  breath?: boolean;
  isAds?: boolean;
  sightPresetId?: string;
  onSightPresetChange?: (presetId: string) => void;
  hasSeparateSight?: boolean;
}

export default function RangeViewControls({ 
  controls: c, 
  breath = false,
  isAds = false,
  sightPresetId = DEFAULT_PRESET_ID,
  onSightPresetChange,
  hasSeparateSight = false,
}: RangeViewControlsProps) {
  const [reticleConfig, setReticleConfig] = useState<ReticleConfig>(loadReticleConfig);
  const [settingsTab, setSettingsTab] = useState<'hud' | 'sight3d' | 'alignment'>('sight3d');
  const [showGrid, setShowGrid] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const currentPreset: SightPresetConfig = getSightPreset(sightPresetId);

  useEffect(() => {
    setIsTouchDevice(
      typeof window !== 'undefined' && 
      ('ontouchstart' in window || navigator.maxTouchPoints > 0)
    );
  }, []);

  const updateReticle = (updates: Partial<ReticleConfig>) => {
    setReticleConfig(prev => {
      const next = { ...prev, ...updates };
      saveReticleConfig(next);
      return next;
    });
  };

  const resetReticle = () => {
    setReticleConfig({ ...DEFAULT_RETICLE_CONFIG });
    saveReticleConfig(DEFAULT_RETICLE_CONFIG);
  };

  const updateAlignment = (updates: Partial<AdsVisualAlignment>) => {
    const next = { ...c.alignment, ...updates };
    c.setAlignment(next);
    saveAdsAlignment(next);
  };

  const resetAlignment = () => {
    c.setAlignment({ ...DEFAULT_ADS_ALIGNMENT });
    saveAdsAlignment(DEFAULT_ADS_ALIGNMENT);
  };

  const handleSelectPreset = (presetId: string) => {
    saveSightPreset(presetId);
    if (onSightPresetChange) {
      onSightPresetChange(presetId);
    }
  };

  const handleStepPreset = (direction: -1 | 1) => {
    const currentIndex = SIGHT_PRESETS.findIndex(p => p.id === currentPreset.id);
    const newIndex = (currentIndex + direction + SIGHT_PRESETS.length) % SIGHT_PRESETS.length;
    handleSelectPreset(SIGHT_PRESETS[newIndex].id);
  };

  const radToDeg = (rad: number) => (rad * 180 / Math.PI).toFixed(1);

  return <>
    {/* ════════════════════════════════════════════════════════════════
        1. TÂM NGẮM HUD CHÍNH (CRISP CROSSHAIR & ADS RETICLE)
        ════════════════════════════════════════════════════════════════ */}
    <ShootingReticleHUD
      isAds={c.panel ? c.previewAds : isAds}
      visible={c.locked || c.panel || isTouchDevice}
      config={reticleConfig}
      previewMode={c.panel}
      showAlignmentGrid={c.panel && showGrid}
    />

    {/* ════════════════════════════════════════════════════════════════
        2. CỤM NÚT GÓC TRÊN BÊN PHẢI (CÀI ĐẶT & TOÀN MÀN HÌNH)
        ════════════════════════════════════════════════════════════════ */}
    <div data-range-controls className="absolute top-2 right-2 z-50 flex gap-1.5" onPointerDown={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
      {!c.locked && (
        <button 
          type="button" 
          disabled={!c.active} 
          aria-label="Cài đặt ngắm & thước ngắm" 
          aria-expanded={c.panel} 
          onClick={() => {
            c.setPreviewAds(true);
            c.setPanel(!c.panel);
          }} 
          className="flex items-center gap-1.5 rounded-xl bg-slate-950/90 hover:bg-slate-900 px-3 py-2 text-xs font-bold text-white border border-slate-700/60 shadow-lg disabled:opacity-40 transition-colors cursor-pointer"
          title="Tùy chỉnh thước ngắm 3D và tâm ngắm HUD"
        >
          <Settings size={15} className="text-amber-400" />
          <span className="hidden sm:inline">Cài đặt ngắm &amp; 3D</span>
        </button>
      )}
      <button 
        type="button" 
        aria-label={c.fullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'} 
        onClick={() => void c.toggleFullscreen()} 
        className="flex items-center gap-1.5 rounded-xl bg-slate-950/90 hover:bg-slate-900 px-3 py-2 text-xs font-bold text-white border border-slate-700/60 shadow-lg transition-colors cursor-pointer"
      >
        {c.fullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
        <span className="hidden sm:inline">{c.fullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}</span>
      </button>
    </div>

    {/* ════════════════════════════════════════════════════════════════
        3. THÔNG BÁO NHẤP ĐỂ ĐIỀU KHIỂN (POINTER LOCK PROMPT)
        ════════════════════════════════════════════════════════════════ */}
    {c.active && !c.locked && !c.panel && (
      <div className="pointer-events-none absolute inset-0 z-10 hidden items-center justify-center [@media(hover:hover)_and_(pointer:fine)]:flex">
        <div className="rounded-2xl bg-slate-950/75 backdrop-blur-xs p-4 text-center text-white border border-white/10 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-center gap-1.5 text-amber-400 font-extrabold text-sm mb-1">
            <Crosshair size={16} />
            <span>NHẤP VÀO MÀN HÌNH ĐỂ ĐIỀU KHIỂN</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Chuột: Xoay hướng ngắm · Chuột trái: Bắn<br />
            Giữ chuột phải: Ngắm bắn (ADS){breath && ' · Phím Shift: Nín thở'}<br />
            <span className="text-slate-400 text-[11px]">Phím ESC: Thoát điều khiển chuột</span>
          </p>
        </div>
      </div>
    )}

    {/* Thông báo lỗi nếu có */}
    {c.error && (
      <div role="status" className="pointer-events-none absolute bottom-24 left-3 right-3 z-50 rounded-xl bg-amber-950/95 border border-amber-700/60 p-2 text-xs text-amber-100 shadow-xl">
        {c.error}
      </div>
    )}

    {/* ════════════════════════════════════════════════════════════════
        4. BẢNG CÀI ĐẶT NGẮM & 3D (GỌN GÀNG, 3 TABS RÕ RÀNG)
        ════════════════════════════════════════════════════════════════ */}
    {c.panel && (
      <section 
        data-range-controls 
        aria-label="Cài đặt ngắm và thước ngắm 3D" 
        onPointerDown={e => e.stopPropagation()} 
        onMouseDown={e => e.stopPropagation()} 
        onKeyDown={e => e.stopPropagation()} 
        className="absolute right-2 top-13 bottom-14 z-40 w-72 sm:w-76 max-w-[86vw] overflow-y-auto rounded-2xl bg-slate-950/95 border border-slate-700/80 p-3 text-xs text-white shadow-2xl space-y-2.5 backdrop-blur-md"
      >
        {/* Tiêu đề & nút đóng */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5 font-black text-xs text-amber-400">
            <Settings size={14} />
            <span>CÀI ĐẶT NGẮM &amp; 3D</span>
          </div>
          <button 
            aria-label="Đóng cài đặt" 
            onClick={() => c.setPanel(false)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* 3 Tabs: Tâm HUD | Thước ngắm 3D | Căn chỉnh */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setSettingsTab('hud')}
            className={`py-1.5 px-1 rounded-lg font-black text-[11px] transition-colors cursor-pointer text-center ${
              settingsTab === 'hud'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tâm HUD
          </button>

          <button
            type="button"
            onClick={() => setSettingsTab('sight3d')}
            className={`py-1.5 px-1 rounded-lg font-black text-[11px] transition-colors cursor-pointer text-center ${
              settingsTab === 'sight3d'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Thước ngắm 3D
          </button>

          <button
            type="button"
            onClick={() => setSettingsTab('alignment')}
            className={`py-1.5 px-1 rounded-lg font-black text-[11px] transition-colors cursor-pointer text-center ${
              settingsTab === 'alignment'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Căn chỉnh
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            TAB 2: THƯỚC NGẮM 3D (TẬP TRUNG GỌN GÀNG)
            ════════════════════════════════════════════════════════════════ */}
        {settingsTab === 'sight3d' && (
          <div className="space-y-2.5 pt-0.5">
            <div className="text-[11px] font-black tracking-wide text-amber-400 uppercase">
              Thước ngắm 3D
            </div>

            {/* Stepper: ◀ PRESET A ▶ */}
            <div className="flex items-center justify-between bg-slate-900 rounded-xl p-2 border border-slate-800">
              <button
                type="button"
                onClick={() => handleStepPreset(-1)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
                title="Vị trí trước"
                aria-label="Vị trí trước"
                disabled={!hasSeparateSight}
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="text-center font-black text-amber-400 text-xs tracking-wider">
                {currentPreset.code}
              </div>

              <button
                type="button"
                onClick={() => handleStepPreset(1)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
                title="Vị trí tiếp theo"
                aria-label="Vị trí tiếp theo"
                disabled={!hasSeparateSight}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Hàng 4 nút: [ A ] [ B ] [ C ] [ D ] */}
            <div className="grid grid-cols-2 gap-1.5">
              {SIGHT_PRESETS.map((p) => {
                const isSelected = p.id === currentPreset.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p.id)}
                    disabled={!hasSeparateSight}
                    aria-pressed={isSelected}
                    className={`py-2 rounded-xl border text-center font-black text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                    title={p.name}
                  >
                    {p.letter}
                  </button>
                );
              })}
            </div>

            {/* Thông báo tình trạng hỗ trợ của model hiện tại */}
            {(
              <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-2.5 text-center text-slate-300 text-[11px] leading-relaxed flex items-start gap-1.5 font-sans">
                <Info size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <span>{hasSeparateSight ? 'Chọn vị trí để quan sát thước ngắm nâng lên trên súng. Chỉ thay đổi hình ảnh, không thay đổi đường bắn hay điểm số.' : 'Mô hình hiện tại chưa hỗ trợ thay đổi bộ phận thước ngắm riêng.'}</span>
              </div>
            )}

            {/* Các nút thao tác chính */}
            <div className="space-y-1.5 pt-1">
              <button
                type="button"
                onClick={() => c.setPreviewAds(!c.previewAds)}
                className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  c.previewAds
                    ? 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400'
                    : 'bg-slate-850 text-slate-200 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <Eye size={14} />
                <span>{c.previewAds ? 'Bắn từ hông' : 'Xem trước ADS'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset(DEFAULT_PRESET_ID)}
                disabled={!hasSeparateSight}
                className="w-full py-1.5 px-3 rounded-xl text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-850 text-[11px] font-semibold border border-slate-800 flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Về vị trí ban đầu</span>
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB 1: TÂM HUD (GỌN GÀNG, SẮC NÉT)
            ════════════════════════════════════════════════════════════════ */}
        {settingsTab === 'hud' && (
          <div className="space-y-2.5 pt-0.5">
            {/* Độ sắc nét & Viền */}
            <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-2.5 space-y-2">
              <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reticleConfig.hasOutline}
                  onChange={e => updateReticle({ hasOutline: e.target.checked })}
                  className="rounded border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span className="font-bold text-[11px]">Viền đen sắc nét (Crisp Edge)</span>
              </label>

              {/* Độ dày nét */}
              <label className="block text-slate-300">
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span>Độ dày nét:</span>
                  <span className="font-mono text-cyan-400 font-bold">{reticleConfig.lineThickness} px</span>
                </div>
                <input
                  type="range"
                  min={1.0}
                  max={3.0}
                  step={0.2}
                  value={reticleConfig.lineThickness}
                  onChange={e => updateReticle({ lineThickness: Number(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </label>

              {/* Màu sắc */}
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Màu tâm ngắm:</span>
                <div className="grid grid-cols-5 gap-1">
                  {(Object.keys(RETICLE_COLORS) as ReticleColorPreset[]).map(key => {
                    const item = RETICLE_COLORS[key];
                    const isSelected = reticleConfig.colorPreset === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => updateReticle({ colorPreset: key })}
                        className={`py-1.5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-800 border-amber-400 shadow-xs'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                        title={item.name}
                      >
                        <span className="w-3 h-3 rounded-full border border-black/50" style={{ backgroundColor: item.hex }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Kiểu tâm ADS */}
            <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-2.5 space-y-2">
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'ak_iron_guide', label: 'Hỗ trợ AK' },
                  { id: 'precision_dot', label: 'Chấm đỏ' },
                  { id: 'tactical_circle', label: 'Vòng tròn' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateReticle({ adsReticleStyle: item.id as AdsReticleStyle, showAdsReticle: true })}
                    className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer text-center ${
                      reticleConfig.showAdsReticle && reticleConfig.adsReticleStyle === item.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Kích thước & Opacity */}
              <label className="block text-slate-300">
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span>Kích thước:</span>
                  <span className="font-mono text-amber-400 font-bold">{reticleConfig.adsReticleSize} px</span>
                </div>
                <input
                  type="range"
                  min={18}
                  max={52}
                  step={2}
                  value={reticleConfig.adsReticleSize}
                  onChange={e => updateReticle({ adsReticleSize: Number(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </label>

              <label className="block text-slate-300">
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span>Độ đậm:</span>
                  <span className="font-mono text-amber-400 font-bold">{Math.round(reticleConfig.adsReticleOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={1.0}
                  step={0.05}
                  value={reticleConfig.adsReticleOpacity}
                  onChange={e => updateReticle({ adsReticleOpacity: Number(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={resetReticle}
              className="w-full py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Đặt lại tâm HUD</span>
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB 3: CĂN CHỈNH (GỌN CHO HỌC SINH + DEV ACCORDION)
            ════════════════════════════════════════════════════════════════ */}
        {settingsTab === 'alignment' && (
          <div className="space-y-2.5 pt-0.5">
            <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800 space-y-1.5">
              <div className="text-xs font-bold text-emerald-400">
                ✓ Góc ngắm đã chuẩn hóa
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                Góc nhìn và súng đã được căn chuẩn để khe ngắm và đầu ngắm AK tự nhiên thẳng hàng.
              </p>
              <button
                type="button"
                onClick={resetAlignment}
                className="w-full py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Khôi phục góc ngắm chuẩn</span>
              </button>
            </div>

            {/* Bật/Tắt Lưới gióng tâm */}
            <div className="flex items-center justify-between bg-slate-900/80 rounded-xl p-2 border border-slate-800">
              <span className="text-[11px] font-bold text-slate-300">Lưới gióng tâm:</span>
              <button
                type="button"
                onClick={() => setShowGrid(!showGrid)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                  showGrid 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {showGrid ? 'Đang bật' : 'Đang tắt'}
              </button>
            </div>

            {/* Mục chi tiết thu gọn cho Dev */}
            <details className="group rounded-xl border border-slate-800 bg-slate-900/60 p-2 transition-all">
              <summary className="flex cursor-pointer items-center justify-between text-[11px] font-bold text-slate-400 hover:text-slate-200">
                <span>🛠️ Thông số chi tiết (Dev)</span>
                <span className="text-[10px] transition-transform group-open:rotate-180">▼</span>
              </summary>
              
              <div className="mt-2 pt-2 border-t border-slate-800 space-y-2">
                {/* Camera X/Y */}
                <label className="block text-slate-300">
                  <div className="flex justify-between text-[10px]">
                    <span>Camera X:</span>
                    <span className="font-mono text-amber-400">{Math.round(c.alignment.cameraOffsetX * 1000)} mm</span>
                  </div>
                  <input 
                    type="range" 
                    min={-VISUAL_OFFSET_LIMIT_POS} 
                    max={VISUAL_OFFSET_LIMIT_POS} 
                    step="0.001" 
                    value={c.alignment.cameraOffsetX} 
                    onChange={e => updateAlignment({ cameraOffsetX: Number(e.target.value) })} 
                    className="block w-full accent-amber-400 cursor-pointer" 
                  />
                </label>

                <label className="block text-slate-300">
                  <div className="flex justify-between text-[10px]">
                    <span>Camera Y:</span>
                    <span className="font-mono text-amber-400">{Math.round(c.alignment.cameraOffsetY * 1000)} mm</span>
                  </div>
                  <input 
                    type="range" 
                    min={-VISUAL_OFFSET_LIMIT_POS} 
                    max={VISUAL_OFFSET_LIMIT_POS} 
                    step="0.001" 
                    value={c.alignment.cameraOffsetY} 
                    onChange={e => updateAlignment({ cameraOffsetY: Number(e.target.value) })} 
                    className="block w-full accent-amber-400 cursor-pointer" 
                  />
                </label>

                <label className="block text-slate-300">
                  <div className="flex justify-between text-[10px]">
                    <span>Pitch:</span>
                    <span className="font-mono text-amber-400">{radToDeg(c.alignment.cameraPitch)}°</span>
                  </div>
                  <input 
                    type="range" 
                    min={-VISUAL_OFFSET_LIMIT_ROT} 
                    max={VISUAL_OFFSET_LIMIT_ROT} 
                    step="0.002" 
                    value={c.alignment.cameraPitch} 
                    onChange={e => updateAlignment({ cameraPitch: Number(e.target.value) })} 
                    className="block w-full accent-amber-400 cursor-pointer" 
                  />
                </label>
              </div>
            </details>
          </div>
        )}
      </section>
    )}
  </>;
}
