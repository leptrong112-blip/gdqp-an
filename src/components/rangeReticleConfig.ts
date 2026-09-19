export type AdsReticleStyle = 'ak_iron_guide' | 'precision_dot' | 'tactical_circle';
export type ReticleColorPreset = 'white' | 'cream' | 'yellow' | 'cyan' | 'green';

export interface ReticleConfig {
  // Trạng thái hiển thị
  showHipCrosshair: boolean;
  showAdsReticle: boolean;

  // Kích thước & Độ mờ
  hipCrosshairSize: number;     // pixel: 16 - 44 (mặc định: 24)
  hipCrosshairOpacity: number;  // 0.2 - 1.0 (mặc định: 0.95)
  adsReticleSize: number;       // pixel: 18 - 52 (mặc định: 30)
  adsReticleOpacity: number;    // 0.2 - 1.0 (mặc định: 0.95)
  adsReticleStyle: AdsReticleStyle;

  // Nâng cấp độ sắc nét & tương phản (Crisp / Sharpness upgrades)
  lineThickness: number;        // 1.0, 1.5, 1.8, 2.2, 2.8 px (mặc định: 1.8)
  hasOutline: boolean;          // Viền đen sắc nét chống lóa trên nền trời/bia sáng (mặc định: true)
  colorPreset: ReticleColorPreset; // 'white' | 'cream' | 'yellow' | 'cyan' | 'green'
  centerDotSize: number;        // 1.0 - 3.0 px (mặc định: 1.8)
  showAlignmentGrid: boolean;   // Hiện vạch gióng tâm khi căn chỉnh 3D (mặc định: false)
}

export const RETICLE_COLORS: Record<ReticleColorPreset, { name: string; hex: string; desc: string }> = {
  white: { name: 'Trắng tinh', hex: '#ffffff', desc: 'Sáng chuẩn' },
  cream: { name: 'Trắng ngà', hex: '#fef08a', desc: 'Dịu mắt' },
  yellow: { name: 'Vàng dạ quang', hex: '#facc15', desc: 'Nổi bật nhất' },
  cyan: { name: 'Xanh băng', hex: '#38bdf8', desc: 'Công nghệ HUD' },
  green: { name: 'Xanh dạ quang', hex: '#4ade80', desc: 'Ngắm mục tiêu' },
};

export const DEFAULT_RETICLE_CONFIG: ReticleConfig = {
  showHipCrosshair: true,
  showAdsReticle: true,
  hipCrosshairSize: 24,
  hipCrosshairOpacity: 0.95,
  adsReticleSize: 30,
  adsReticleOpacity: 0.95,
  adsReticleStyle: 'ak_iron_guide',
  lineThickness: 1.8,
  hasOutline: true,
  colorPreset: 'white',
  centerDotSize: 1.8,
  showAlignmentGrid: false,
};

export const RETICLE_STORAGE_KEY = 'akmHudReticleSettings_v2';

export function sanitizeReticleConfig(value: unknown): ReticleConfig {
  const result: ReticleConfig = { ...DEFAULT_RETICLE_CONFIG };
  if (!value || typeof value !== 'object') return result;
  
  const v = value as Record<string, unknown>;
  
  if (typeof v.showHipCrosshair === 'boolean') result.showHipCrosshair = v.showHipCrosshair;
  if (typeof v.showAdsReticle === 'boolean') result.showAdsReticle = v.showAdsReticle;
  if (typeof v.hasOutline === 'boolean') result.hasOutline = v.hasOutline;
  if (typeof v.showAlignmentGrid === 'boolean') result.showAlignmentGrid = v.showAlignmentGrid;

  if (typeof v.hipCrosshairSize === 'number' && Number.isFinite(v.hipCrosshairSize)) {
    result.hipCrosshairSize = Math.max(16, Math.min(48, Math.round(v.hipCrosshairSize)));
  }
  if (typeof v.hipCrosshairOpacity === 'number' && Number.isFinite(v.hipCrosshairOpacity)) {
    result.hipCrosshairOpacity = Math.max(0.1, Math.min(1.0, Number(v.hipCrosshairOpacity.toFixed(2))));
  }
  if (typeof v.adsReticleSize === 'number' && Number.isFinite(v.adsReticleSize)) {
    result.adsReticleSize = Math.max(18, Math.min(56, Math.round(v.adsReticleSize)));
  }
  if (typeof v.adsReticleOpacity === 'number' && Number.isFinite(v.adsReticleOpacity)) {
    result.adsReticleOpacity = Math.max(0.1, Math.min(1.0, Number(v.adsReticleOpacity.toFixed(2))));
  }
  if (typeof v.lineThickness === 'number' && Number.isFinite(v.lineThickness)) {
    result.lineThickness = Math.max(1.0, Math.min(3.5, Number(v.lineThickness.toFixed(1))));
  }
  if (typeof v.centerDotSize === 'number' && Number.isFinite(v.centerDotSize)) {
    result.centerDotSize = Math.max(1.0, Math.min(3.5, Number(v.centerDotSize.toFixed(1))));
  }

  if (v.adsReticleStyle === 'ak_iron_guide' || v.adsReticleStyle === 'precision_dot' || v.adsReticleStyle === 'tactical_circle') {
    result.adsReticleStyle = v.adsReticleStyle;
  }
  if (v.colorPreset === 'white' || v.colorPreset === 'cream' || v.colorPreset === 'yellow' || v.colorPreset === 'cyan' || v.colorPreset === 'green') {
    result.colorPreset = v.colorPreset;
  }

  return result;
}

export function loadReticleConfig(): ReticleConfig {
  try {
    const raw = localStorage.getItem(RETICLE_STORAGE_KEY);
    return raw ? sanitizeReticleConfig(JSON.parse(raw)) : { ...DEFAULT_RETICLE_CONFIG };
  } catch {
    return { ...DEFAULT_RETICLE_CONFIG };
  }
}

export function saveReticleConfig(config: ReticleConfig): void {
  try {
    localStorage.setItem(RETICLE_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage quota error
  }
}
