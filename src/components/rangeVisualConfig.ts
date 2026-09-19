// Cấu hình căn chỉnh hình ảnh / camera / mô hình 3D khi ngắm (ADS Visual Alignment)
// Các thông số này điều chỉnh vị trí góc nhìn và súng trong game để đầu ngắm - khe ngắm ăn khớp chuẩn xác.
export interface AdsVisualAlignment {
  // 1. Vị trí Camera ADS (đơn vị: mét)
  cameraOffsetX: number; // Sang trái (-) / Sang phải (+)
  cameraOffsetY: number; // Xuống dưới (-) / Lên trên (+)
  cameraOffsetZ: number; // Lùi ra xa (-) / Tiến lại gần (+)

  // 2. Góc nhìn Camera ADS (đơn vị: radian)
  cameraPitch: number;   // Cúi xuống (-) / Ngẩng lên (+)
  cameraYaw: number;     // Quay trái (-) / Quay phải (+)
  cameraRoll: number;    // Nghiêng trái (-) / Nghiêng phải (+)

  // 3. Vị trí Mô hình súng (đơn vị: mét)
  weaponOffsetX: number; // Dịch trái (-) / Dịch phải (+)
  weaponOffsetY: number; // Hạ thấp (-) / Nâng cao (+)
  weaponOffsetZ: number; // Đẩy ra xa (-) / Kéo lại gần (+)

  // 4. Góc xoay Mô hình súng (đơn vị: radian)
  weaponPitch: number;   // Chúi nòng (-) / Chếch nòng lên (+)
  weaponYaw: number;     // Lệch nòng trái (-) / Lệch nòng phải (+)
  weaponRoll: number;    // Nghiêng mặt súng trái (-) / Nghiêng mặt súng phải (+)
}

export const ADS_STORAGE_KEY = 'akmAds3DAlignment_v2';

export const DEFAULT_ADS_ALIGNMENT: AdsVisualAlignment = {
  cameraOffsetX: 0,
  cameraOffsetY: 0,
  cameraOffsetZ: 0,
  cameraPitch: 0,
  cameraYaw: 0,
  cameraRoll: 0,
  weaponOffsetX: 0,
  weaponOffsetY: 0,
  weaponOffsetZ: 0,
  weaponPitch: 0,
  weaponYaw: 0,
  weaponRoll: 0,
};

// Giới hạn dịch chuyển vị trí (±15 cm) và góc xoay (±0.25 rad ~ 14.3 độ)
export const VISUAL_OFFSET_LIMIT_POS = 0.15;
export const VISUAL_OFFSET_LIMIT_ROT = 0.25;
export const MOUSE_SENSITIVITY = 0.0015;
export const MAX_LOOK_PITCH = 1.2;

export function sanitizeAlignment(value: unknown): AdsVisualAlignment {
  const result: AdsVisualAlignment = { ...DEFAULT_ADS_ALIGNMENT };
  if (!value || typeof value !== 'object') return result;
  
  const v = value as Record<string, unknown>;

  // Vị trí Camera & Súng (Giới hạn ±0.15m)
  const posKeys: (keyof AdsVisualAlignment)[] = [
    'cameraOffsetX', 'cameraOffsetY', 'cameraOffsetZ',
    'weaponOffsetX', 'weaponOffsetY', 'weaponOffsetZ'
  ];
  for (const key of posKeys) {
    const val = v[key];
    if (typeof val === 'number' && Number.isFinite(val)) {
      result[key] = Math.max(-VISUAL_OFFSET_LIMIT_POS, Math.min(VISUAL_OFFSET_LIMIT_POS, Number(val.toFixed(4))));
    }
  }

  // Góc xoay Camera & Súng (Giới hạn ±0.25 rad)
  const rotKeys: (keyof AdsVisualAlignment)[] = [
    'cameraPitch', 'cameraYaw', 'cameraRoll',
    'weaponPitch', 'weaponYaw', 'weaponRoll'
  ];
  for (const key of rotKeys) {
    const val = v[key];
    if (typeof val === 'number' && Number.isFinite(val)) {
      result[key] = Math.max(-VISUAL_OFFSET_LIMIT_ROT, Math.min(VISUAL_OFFSET_LIMIT_ROT, Number(val.toFixed(4))));
    }
  }

  return result;
}

export function loadAdsAlignment(): AdsVisualAlignment {
  try {
    const raw = localStorage.getItem(ADS_STORAGE_KEY);
    return raw ? sanitizeAlignment(JSON.parse(raw)) : { ...DEFAULT_ADS_ALIGNMENT };
  } catch {
    return { ...DEFAULT_ADS_ALIGNMENT };
  }
}

export function saveAdsAlignment(alignment: AdsVisualAlignment): void {
  try {
    localStorage.setItem(ADS_STORAGE_KEY, JSON.stringify(alignment));
  } catch {
    // Ignore storage quota error
  }
}

export function moveLook(look: { x: number; y: number }, dx: number, dy: number) {
  return { 
    x: (look.x - dx * MOUSE_SENSITIVITY) % (2 * Math.PI), 
    y: Math.max(-MAX_LOOK_PITCH, Math.min(MAX_LOOK_PITCH, look.y - dy * MOUSE_SENSITIVITY)) 
  };
}
