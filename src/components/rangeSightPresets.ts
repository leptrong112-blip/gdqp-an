// Cấu hình các trạng thái hình học trực quan của thước ngắm 3D trên súng
// KHÔNG dùng các thông số cự ly 100m/200m/300m/400m hoặc đạn đạo ngoài đời thực.
// Chỉ chứa các độ lệch nhỏ (local offset) áp dụng cho node thước ngắm thật khi model hỗ trợ.

export interface SightPresetConfig {
  id: string;              // 'preset_a' | 'preset_b' | 'preset_c' | 'preset_d'
  code: string;            // 'PRESET A' | 'PRESET B' | 'PRESET C' | 'PRESET D'
  letter: string;          // 'A' | 'B' | 'C' | 'D'
  name: string;            // 'Preset A (Mặc định)', 'Preset B', ...
  // Local transform offsets áp dụng vào node thước ngắm thật (nếu có node riêng)
  localOffsetZ: number;    // Dịch chuyển nhỏ theo trục Z cục bộ của node
  localOffsetY: number;    // Dịch chuyển nhỏ theo trục Y cục bộ của node
  localPitchRad: number;   // Góc xoay pitch nhỏ của node (radian)
}

export const SIGHT_PRESET_STORAGE_KEY = 'akmSightPreset_v3';

export const SIGHT_PRESETS: SightPresetConfig[] = [
  {
    id: 'preset_a',
    code: 'VỊ TRÍ BAN ĐẦU',
    letter: 'Ban đầu',
    name: 'Vị trí ban đầu của thước ngắm',
    localOffsetZ: 0,
    localOffsetY: 0,
    localPitchRad: 0,
  },
  {
    id: 'preset_b',
    code: 'NÂNG NHẸ',
    letter: 'Nâng nhẹ',
    name: 'Thước ngắm nâng nhẹ',
    localOffsetZ: 0,
    localOffsetY: 0,
    localPitchRad: -0.025,
  },
  {
    id: 'preset_c',
    code: 'NÂNG VỪA',
    letter: 'Nâng vừa',
    name: 'Thước ngắm nâng vừa',
    localOffsetZ: 0,
    localOffsetY: 0,
    localPitchRad: -0.05,
  },
  {
    id: 'preset_d',
    code: 'NÂNG CAO',
    letter: 'Nâng cao',
    name: 'Thước ngắm nâng cao',
    localOffsetZ: 0,
    localOffsetY: 0,
    localPitchRad: -0.075,
  },
];

export const DEFAULT_PRESET_ID = 'preset_a';

export function getSightPreset(id: string): SightPresetConfig {
  const found = SIGHT_PRESETS.find(p => p.id === id);
  return found || SIGHT_PRESETS[0];
}

export function loadSightPreset(): string {
  try {
    const raw = localStorage.getItem(SIGHT_PRESET_STORAGE_KEY);
    if (raw && SIGHT_PRESETS.some(p => p.id === raw)) {
      return raw;
    }
  } catch {
    // Ignore storage error
  }
  return DEFAULT_PRESET_ID;
}

export function saveSightPreset(presetId: string): void {
  try {
    if (SIGHT_PRESETS.some(p => p.id === presetId)) {
      localStorage.setItem(SIGHT_PRESET_STORAGE_KEY, presetId);
    }
  } catch {
    // Ignore storage quota error
  }
}
